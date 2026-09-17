using Dapper;
using Npgsql;
using Oficina.DAL.Common;
using Oficina.Domain.Entities;
using Oficina.Domain.Enums;
using Oficina.Domain.Exceptions;
using Oficina.Domain.Repositories;

namespace Oficina.DAL.Repositories;

public sealed class AgendamentoRepositorio : IAgendamentoRepositorio
{
    // Só quem está agendado ou em andamento ocupa vaga. Mesmo critério dos índices parciais do banco.
    private const string ApenasAtivos = "a.status IN ('Agendado', 'EmAndamento')";

    // Dois intervalos se cruzam quando um começa antes do outro terminar e termina depois de ele começar.
    // Bordas não contam: terminar às 10:00 e começar às 10:00 é sequência, não sobreposição.
    private const string CruzaOPeriodo = "a.inicio < @Fim AND a.fim > @Inicio";

    private const string Juncoes = """
        JOIN veiculos v ON v.id = a.veiculo_id
        JOIN clientes c ON c.id = v.cliente_id
        """;

    private const string ColunasDoAgendamento = """
        a.id            AS Id,
        a.veiculo_id    AS VeiculoId,
        a.inicio        AS Inicio,
        a.fim           AS Fim,
        a.tipo_servico  AS TipoServico,
        a.status        AS Status,
        a.criado_em     AS CriadoEm,
        a.atualizado_em AS AtualizadoEm
        """;

    private const string ColunasDaAgenda = $"""
        {ColunasDoAgendamento},
        v.placa  AS Placa,
        v.modelo AS Modelo,
        v.ano    AS Ano,
        c.id     AS ClienteId,
        c.nome   AS NomeDoCliente
        """;

    private const string ColunasDoDetalhe = $"""
        {ColunasDaAgenda},
        c.telefone  AS TelefoneDoCliente,
        c.email     AS EmailDoCliente
        """;

    private readonly NpgsqlDataSource _fonteDeDados;

    public AgendamentoRepositorio(NpgsqlDataSource fonteDeDados)
    {
        _fonteDeDados = fonteDeDados;
    }

    // O pico só pode mudar quando alguém começa: entre dois inícios, o número de serviços em
    // curso não sobe. Então basta medir no começo da janela e no começo de cada agendamento
    // que cai dentro dela — é a varredura clássica, e evita varrer minuto a minuto.
    //
    // Contar quem cruza a janela, que é o que esta consulta fazia antes, recusava caso
    // legítimo: três serviços de trinta minutos em sequência cruzam a janela de um de noventa
    // sem nunca estarem juntos.
    private const string PicoDeSimultaneos = $"""
        WITH ativos AS (
            SELECT a.inicio, a.fim
            FROM agendamentos a
            WHERE {ApenasAtivos}
              AND {CruzaOPeriodo}
        ),
        marcos AS (
            SELECT @Inicio::timestamptz AS instante
            UNION
            SELECT inicio FROM ativos
            WHERE inicio > @Inicio::timestamptz AND inicio < @Fim::timestamptz
        )
        SELECT coalesce(max((
            SELECT count(*)
            FROM ativos a
            WHERE a.inicio <= m.instante AND a.fim > m.instante
        )), 0)
        FROM marcos m
        """;

    // Um lock só para a oficina inteira: a capacidade é dela, não de um horário. Com várias
    // lojas, a chave seria por loja. É de transação (xact): solta sozinho no commit ou no rollback.
    private const string TravarCapacidade =
        "SELECT pg_advisory_xact_lock(hashtext('agendamentos:capacidade'))";

    public async Task<AgendamentoNaAgenda> AdicionarAsync(
        Agendamento agendamento,
        int maximoDeSimultaneos,
        CancellationToken cancellationToken
    )
    {
        // Insere e já junta veículo e cliente na mesma ida ao banco, para a resposta da criação
        // não precisar de uma segunda consulta só para descobrir a placa.
        const string sql = $"""
            WITH novo AS (
                INSERT INTO agendamentos (id, veiculo_id, inicio, fim, tipo_servico, status)
                VALUES (@Id, @VeiculoId, @Inicio, @Fim, @TipoServico, @Status)
                RETURNING *
            )
            SELECT
            {ColunasDaAgenda}
            FROM novo a
            {Juncoes}
            """;

        await using var conexao = await _fonteDeDados.OpenConnectionAsync(cancellationToken);
        await using var transacao = await conexao.BeginTransactionAsync(cancellationToken);

        // Medir e gravar viram um passo só: quem chega enquanto outro grava espera o lock, e ao
        // medir já enxerga o que o outro gravou. Sem isto, seis pedidos simultâneos para o mesmo
        // horário passavam todos pela medição antes de qualquer um gravar — e os seis entravam.
        await conexao.ExecuteAsync(new CommandDefinition(
            TravarCapacidade,
            transaction: transacao,
            cancellationToken: cancellationToken
        ));

        var pico = await conexao.ExecuteScalarAsync<int>(new CommandDefinition(
            PicoDeSimultaneos,
            new { Inicio = agendamento.Inicio.UtcDateTime, Fim = agendamento.Fim.UtcDateTime },
            transaction: transacao,
            cancellationToken: cancellationToken
        ));

        // Sair sem commit desfaz a transação e solta o lock.
        if (pico >= maximoDeSimultaneos)
        {
            throw new ConflitoException(
                $"A oficina já tem {maximoDeSimultaneos} serviços nesse horário."
            );
        }

        try
        {
            var linha = await conexao.QuerySingleAsync<AgendaLinha>(new CommandDefinition(
                sql,
                new
                {
                    agendamento.Id,
                    agendamento.VeiculoId,
                    Inicio = agendamento.Inicio.UtcDateTime,
                    Fim = agendamento.Fim.UtcDateTime,
                    TipoServico = agendamento.TipoServico.ToString(),
                    Status = agendamento.Status.ToString()
                },
                transaction: transacao,
                cancellationToken: cancellationToken
            ));

            await transacao.CommitAsync(cancellationToken);

            return MontarAgenda(linha);
        }
        // A constraint de exclusão fecha a janela entre duas requisições simultâneas do mesmo veículo:
        // a segunda é recusada pelo banco mesmo que ambas tenham passado pela verificação anterior.
        catch (PostgresException excecao)
            when (excecao.SqlState == PostgresErrorCodes.ExclusionViolation
                && excecao.ConstraintName == "ex_agendamentos_veiculo_sobreposicao")
        {
            throw new ConflitoException("Este veículo já tem um agendamento nesse horário.");
        }
    }

    public async Task<AgendamentoDetalhado?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken)
    {
        const string sql = $"""
            SELECT
            {ColunasDoDetalhe}
            FROM agendamentos a
            {Juncoes}
            WHERE a.id = @Id
            """;

        await using var conexao = await _fonteDeDados.OpenConnectionAsync(cancellationToken);

        var linha = await conexao.QuerySingleOrDefaultAsync<DetalheLinha>(new CommandDefinition(
            sql,
            new { Id = id },
            cancellationToken: cancellationToken
        ));

        return linha is null ? null : MontarDetalhe(linha);
    }

    public async Task<AgendamentoNaAgenda> AtualizarStatusAsync(
        Agendamento agendamento,
        StatusAgendamento statusAnterior,
        CancellationToken cancellationToken
    )
    {
        // atualizado_em não aparece no SET: o gatilho do banco cuida dele em todo UPDATE.
        // O status anterior entra no WHERE: se outra requisição já mudou o status desde a leitura,
        // nenhuma linha é atualizada e esta gravação não apaga a que chegou antes.
        const string sql = $"""
            WITH alterado AS (
                UPDATE agendamentos
                SET status = @Status
                WHERE id = @Id
                  AND status = @StatusAnterior
                RETURNING *
            )
            SELECT
            {ColunasDaAgenda}
            FROM alterado a
            {Juncoes}
            """;

        await using var conexao = await _fonteDeDados.OpenConnectionAsync(cancellationToken);

        var linha = await conexao.QuerySingleOrDefaultAsync<AgendaLinha>(new CommandDefinition(
            sql,
            new
            {
                agendamento.Id,
                Status = agendamento.Status.ToString(),
                StatusAnterior = statusAnterior.ToString()
            },
            cancellationToken: cancellationToken
        ));

        if (linha is null)
        {
            throw new ConflitoException(
                "O status do agendamento mudou enquanto esta alteração era processada."
            );
        }

        return MontarAgenda(linha);
    }

    public async Task<int> PicoDeSimultaneosAsync(
        DateTimeOffset inicio,
        DateTimeOffset fim,
        CancellationToken cancellationToken
    )
    {
        await using var conexao = await _fonteDeDados.OpenConnectionAsync(cancellationToken);

        return await conexao.ExecuteScalarAsync<int>(new CommandDefinition(
            PicoDeSimultaneos,
            new { Inicio = inicio.UtcDateTime, Fim = fim.UtcDateTime },
            cancellationToken: cancellationToken
        ));
    }

    public async Task<bool> ExisteSobreposicaoDoVeiculoAsync(
        Guid veiculoId,
        DateTimeOffset inicio,
        DateTimeOffset fim,
        CancellationToken cancellationToken
    )
    {
        // EXISTS para o Postgres parar na primeira linha que casar, em vez de contar todas.
        const string sql = $"""
            SELECT EXISTS (
                SELECT 1
                FROM agendamentos a
                WHERE a.veiculo_id = @VeiculoId
                  AND {ApenasAtivos}
                  AND {CruzaOPeriodo}
            )
            """;

        await using var conexao = await _fonteDeDados.OpenConnectionAsync(cancellationToken);

        return await conexao.ExecuteScalarAsync<bool>(new CommandDefinition(
            sql,
            new
            {
                VeiculoId = veiculoId,
                Inicio = inicio.UtcDateTime,
                Fim = fim.UtcDateTime
            },
            cancellationToken: cancellationToken
        ));
    }

    public async Task<Pagina<AgendamentoNaAgenda>> ListarAsync(
        FiltroDaAgenda filtro,
        CancellationToken cancellationToken
    )
    {
        // Filtro opcional resolvido no próprio SQL: com o parâmetro nulo a condição vira verdadeira
        // e o Postgres a descarta.
        // Comparação direta contra a coluna, sem função em volta dela: com função o índice de
        // inicio não seria usado. Quem traduz dia em faixa é o HorarioDaOficina.
        // Os casts são obrigatórios: sem eles o Postgres não consegue deduzir o tipo do parâmetro,
        // porque o primeiro uso é um IS NULL, que serve para qualquer tipo.
        // O cliente entra por subconsulta, e não por junção: a contagem não tem junção nenhuma, e
        // é o mesmo texto de filtro que serve às duas consultas.
        const string condicoes = """
            WHERE (@De::timestamptz IS NULL OR a.inicio >= @De::timestamptz)
              AND (@Ate::timestamptz IS NULL OR a.inicio < @Ate::timestamptz)
              AND (@Status::text IS NULL OR a.status = @Status::text)
              AND (@ClienteId::uuid IS NULL OR a.veiculo_id IN (
                      SELECT id FROM veiculos WHERE cliente_id = @ClienteId::uuid))
            """;

        // A ordem é escolhida aqui entre dois textos fixos, e nunca interpolada de fora: ORDER BY
        // não aceita parâmetro, então o que vem de fora é o booleano, não o SQL.
        var ordem = filtro.MaisRecentesPrimeiro ? "a.inicio DESC, a.id DESC" : "a.inicio, a.id";

        var sql = $"""
            SELECT
            {ColunasDaAgenda}
            FROM agendamentos a
            {Juncoes}
            {condicoes}
            ORDER BY {ordem}
            LIMIT @Tamanho OFFSET @Pulo;

            SELECT count(*)
            FROM agendamentos a
            {condicoes};
            """;

        await using var conexao = await _fonteDeDados.OpenConnectionAsync(cancellationToken);

        // Duas consultas numa ida só: a página de itens e o total que casa com o mesmo filtro.
        await using var resultado = await conexao.QueryMultipleAsync(new CommandDefinition(
            sql,
            new
            {
                De = filtro.De?.UtcDateTime,
                Ate = filtro.Ate?.UtcDateTime,
                Status = filtro.Status?.ToString(),
                filtro.ClienteId,
                Tamanho = filtro.TamanhoDaPagina,
                Pulo = (filtro.Pagina - 1) * filtro.TamanhoDaPagina
            },
            cancellationToken: cancellationToken
        ));

        var linhas = await resultado.ReadAsync<AgendaLinha>();
        var total = await resultado.ReadSingleAsync<int>();

        return new Pagina<AgendamentoNaAgenda>(linhas.Select(MontarAgenda).ToList(), total);
    }

    private static Agendamento MontarEntidade(AgendaLinha linha)
    {
        return Agendamento.Reconstituir(
            linha.Id,
            linha.VeiculoId,
            Datas.EmUtc(linha.Inicio),
            Datas.EmUtc(linha.Fim),
            Enum.Parse<TipoServico>(linha.TipoServico),
            Enum.Parse<StatusAgendamento>(linha.Status),
            Datas.EmUtc(linha.CriadoEm),
            Datas.EmUtc(linha.AtualizadoEm)
        );
    }

    private static AgendamentoNaAgenda MontarAgenda(AgendaLinha linha)
    {
        return new AgendamentoNaAgenda(
            MontarEntidade(linha),
            linha.Placa,
            linha.Modelo,
            linha.Ano,
            linha.ClienteId,
            linha.NomeDoCliente
        );
    }

    private static AgendamentoDetalhado MontarDetalhe(DetalheLinha linha)
    {
        return new AgendamentoDetalhado(
            MontarEntidade(linha),
            linha.Placa,
            linha.Modelo,
            linha.Ano,
            linha.ClienteId,
            linha.NomeDoCliente,
            linha.TelefoneDoCliente,
            linha.EmailDoCliente
        );
    }

    // O detalhe herda as colunas da agenda e acrescenta as suas, então a linha também herda.
    private record AgendaLinha(
        Guid Id,
        Guid VeiculoId,
        DateTime Inicio,
        DateTime Fim,
        string TipoServico,
        string Status,
        DateTime CriadoEm,
        DateTime AtualizadoEm,
        string Placa,
        string Modelo,
        int Ano,
        Guid ClienteId,
        string NomeDoCliente
    );

    private sealed record DetalheLinha(
        Guid Id,
        Guid VeiculoId,
        DateTime Inicio,
        DateTime Fim,
        string TipoServico,
        string Status,
        DateTime CriadoEm,
        DateTime AtualizadoEm,
        string Placa,
        string Modelo,
        int Ano,
        Guid ClienteId,
        string NomeDoCliente,
        string TelefoneDoCliente,
        string EmailDoCliente
    ) : AgendaLinha(
        Id, VeiculoId, Inicio, Fim, TipoServico, Status, CriadoEm, AtualizadoEm,
        Placa, Modelo, Ano, ClienteId, NomeDoCliente
    );
}

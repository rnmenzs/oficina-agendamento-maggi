using Dapper;
using Npgsql;
using Oficina.DAL.Common;
using Oficina.Domain.Entities;
using Oficina.Domain.Exceptions;
using Oficina.Domain.Repositories;

namespace Oficina.DAL.Repositories;

public sealed class VeiculoRepositorio : IVeiculoRepositorio
{
    // Apelidos no próprio SQL em vez de ligar o casamento por sublinhado do Dapper,
    // que é estado global e afetaria todas as consultas do processo.
    private const string Colunas = """
        id            AS Id,
        cliente_id    AS ClienteId,
        placa         AS Placa,
        modelo        AS Modelo,
        ano           AS Ano,
        criado_em     AS CriadoEm,
        atualizado_em AS AtualizadoEm
        """;

    private readonly NpgsqlDataSource _fonteDeDados;

    public VeiculoRepositorio(NpgsqlDataSource fonteDeDados)
    {
        _fonteDeDados = fonteDeDados;
    }

    public async Task<Veiculo> AdicionarAsync(Veiculo veiculo, CancellationToken cancellationToken)
    {
        // O id vem do domínio; os carimbos vêm do banco e voltam pelo RETURNING.
        const string sql = """
            INSERT INTO veiculos (id, cliente_id, placa, modelo, ano)
            VALUES (@Id, @ClienteId, @Placa, @Modelo, @Ano)
            RETURNING criado_em AS CriadoEm, atualizado_em AS AtualizadoEm
            """;

        await using var conexao = await _fonteDeDados.OpenConnectionAsync(cancellationToken);

        try
        {
            var carimbos = await conexao.QuerySingleAsync<CarimbosLinha>(new CommandDefinition(
                sql,
                new
                {
                    veiculo.Id,
                    veiculo.ClienteId,
                    // Nomeado porque o objeto anônimo geraria a propriedade "Valor", e o SQL pede @Placa.
                    Placa = veiculo.Placa.Valor,
                    veiculo.Modelo,
                    veiculo.Ano
                },
                cancellationToken: cancellationToken
            ));

            return Veiculo.Reconstituir(
                veiculo.Id,
                veiculo.ClienteId,
                veiculo.Placa.Valor,
                veiculo.Modelo,
                veiculo.Ano,
                Datas.EmUtc(carimbos.CriadoEm),
                Datas.EmUtc(carimbos.AtualizadoEm)
            );
        }
        // Traduz aqui porque a BLL não pode depender do Npgsql para reconhecer o erro.
        // A chave primária levanta o mesmo código, por isso a restrição é conferida pelo nome.
        catch (PostgresException excecao)
            when (excecao.SqlState == PostgresErrorCodes.UniqueViolation
                && excecao.ConstraintName == "uq_veiculos_placa")
        {
            throw new ConflitoException("Já existe um veículo com esta placa.");
        }
    }

    public async Task<Veiculo?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken)
    {
        const string sql = $"""
            SELECT
            {Colunas}
            FROM veiculos
            WHERE id = @Id
            """;

        await using var conexao = await _fonteDeDados.OpenConnectionAsync(cancellationToken);

        var linha = await conexao.QuerySingleOrDefaultAsync<VeiculoLinha>(new CommandDefinition(
            sql,
            new { Id = id },
            cancellationToken: cancellationToken
        ));

        return linha is null ? null : Montar(linha);
    }

    public async Task<IReadOnlyList<Veiculo>> ListarAsync(CancellationToken cancellationToken)
    {
        // Ordenado por placa por ser única: garante ordem estável entre chamadas.
        const string sql = $"""
            SELECT
            {Colunas}
            FROM veiculos
            ORDER BY placa
            """;

        await using var conexao = await _fonteDeDados.OpenConnectionAsync(cancellationToken);

        var linhas = await conexao.QueryAsync<VeiculoLinha>(new CommandDefinition(
            sql,
            cancellationToken: cancellationToken
        ));

        return linhas.Select(Montar).ToList();
    }

    public async Task<IReadOnlyList<Veiculo>> ListarPorClienteAsync(
        Guid clienteId,
        CancellationToken cancellationToken
    )
    {
        const string sql = $"""
            SELECT
            {Colunas}
            FROM veiculos
            WHERE cliente_id = @ClienteId
            ORDER BY placa
            """;

        await using var conexao = await _fonteDeDados.OpenConnectionAsync(cancellationToken);

        var linhas = await conexao.QueryAsync<VeiculoLinha>(new CommandDefinition(
            sql,
            new { ClienteId = clienteId },
            cancellationToken: cancellationToken
        ));

        return linhas.Select(Montar).ToList();
    }

    private static Veiculo Montar(VeiculoLinha linha)
    {
        return Veiculo.Reconstituir(
            linha.Id,
            linha.ClienteId,
            linha.Placa,
            linha.Modelo,
            linha.Ano,
            Datas.EmUtc(linha.CriadoEm),
            Datas.EmUtc(linha.AtualizadoEm)
        );
    }

    private sealed record VeiculoLinha(
        Guid Id,
        Guid ClienteId,
        string Placa,
        string Modelo,
        int Ano,
        DateTime CriadoEm,
        DateTime AtualizadoEm
    );

    private sealed record CarimbosLinha(
        DateTime CriadoEm,
        DateTime AtualizadoEm
    );
}

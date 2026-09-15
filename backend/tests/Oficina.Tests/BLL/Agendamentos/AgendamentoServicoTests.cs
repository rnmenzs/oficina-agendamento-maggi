using Oficina.BLL.Agendamentos;
using Oficina.Domain.Entities;
using Oficina.Domain.Enums;
using Oficina.Domain.Exceptions;
using Oficina.Domain.Repositories;
using Oficina.DTO.Agendamentos;

namespace Oficina.Tests.BLL.Agendamentos;

public class AgendamentoServicoTests
{
    // Terça 15/09/2026, meio-dia na oficina.
    private static readonly DateTimeOffset Carimbo = new(2026, 9, 15, 15, 0, 0, TimeSpan.Zero);

    // Quarta 16/09/2026 às 09:00 na oficina, dentro do horário de funcionamento e no futuro.
    private static readonly DateTimeOffset NoveDaManha = new(2026, 9, 16, 9, 0, 0, TimeSpan.FromHours(-3));

    [Fact]
    public async Task CriarAsync_devolve_response_com_os_dados_do_veiculo_e_do_dono()
    {
        var (servico, veiculos, _) = Montar();

        var response = await servico.CriarAsync(
            new CriarAgendamentoRequest(veiculos[0].Id, NoveDaManha, "TrocaOleo"),
            CancellationToken.None
        );

        Assert.Equal(veiculos[0].Id, response.VeiculoId);
        Assert.Equal("ABC1234", response.Placa);
        Assert.Equal("Fiat Argo", response.Modelo);
        Assert.Equal("Dono Teste", response.NomeDoCliente);
        Assert.Equal(NoveDaManha, response.Inicio);
        Assert.Equal(NoveDaManha.AddMinutes(30), response.Fim);
        Assert.Equal("Agendado", response.Status);
        Assert.Equal(Carimbo, response.CriadoEm);
    }

    [Fact]
    public async Task CriarAsync_recusa_veiculo_inexistente_antes_de_tocar_no_repositorio()
    {
        var (servico, _, agendamentos) = Montar();

        var excecao = await Assert.ThrowsAsync<NaoEncontradoException>(
            () => servico.CriarAsync(
                new CriarAgendamentoRequest(Guid.CreateVersion7(), NoveDaManha, "TrocaOleo"),
                CancellationToken.None
            )
        );

        Assert.Contains("Veículo não encontrado", excecao.Message);
        Assert.Empty(agendamentos.Agendamentos);
    }

    [Fact]
    public async Task CriarAsync_recusa_tipo_de_servico_invalido_listando_os_aceitos()
    {
        var (servico, veiculos, agendamentos) = Montar();

        var excecao = await Assert.ThrowsAsync<DomainException>(
            () => servico.CriarAsync(
                new CriarAgendamentoRequest(veiculos[0].Id, NoveDaManha, "Lavagem"),
                CancellationToken.None
            )
        );

        Assert.Contains("TrocaOleo, Revisao, Diagnostico", excecao.Message);
        Assert.Empty(agendamentos.Agendamentos);
    }

    [Fact]
    public async Task CriarAsync_recusa_horario_fora_do_funcionamento_sem_gravar()
    {
        var (servico, veiculos, agendamentos) = Montar();
        var seteDaManha = NoveDaManha.AddHours(-2);

        await Assert.ThrowsAsync<DomainException>(
            () => servico.CriarAsync(
                new CriarAgendamentoRequest(veiculos[0].Id, seteDaManha, "TrocaOleo"),
                CancellationToken.None
            )
        );

        Assert.Empty(agendamentos.Agendamentos);
    }

    [Fact]
    public async Task CriarAsync_recusa_o_quarto_servico_no_mesmo_horario()
    {
        var (servico, veiculos, _) = Montar();
        await CriarTres(servico, veiculos);

        var excecao = await Assert.ThrowsAsync<ConflitoException>(
            () => servico.CriarAsync(
                new CriarAgendamentoRequest(veiculos[3].Id, NoveDaManha, "TrocaOleo"),
                CancellationToken.None
            )
        );

        Assert.Contains("3 serviços", excecao.Message);
    }

    [Fact]
    public async Task CriarAsync_libera_a_vaga_quando_um_dos_tres_e_cancelado()
    {
        var (servico, veiculos, _) = Montar();
        var criados = await CriarTres(servico, veiculos);

        await servico.AlterarStatusAsync(
            criados[0].Id,
            new AlterarStatusRequest("Cancelado"),
            CancellationToken.None
        );

        var quarto = await servico.CriarAsync(
            new CriarAgendamentoRequest(veiculos[3].Id, NoveDaManha, "TrocaOleo"),
            CancellationToken.None
        );

        Assert.Equal("Agendado", quarto.Status);
    }

    [Fact]
    public async Task CriarAsync_recusa_o_mesmo_veiculo_em_horario_sobreposto()
    {
        var (servico, veiculos, agendamentos) = Montar();
        await servico.CriarAsync(
            new CriarAgendamentoRequest(veiculos[0].Id, NoveDaManha, "TrocaOleo"),
            CancellationToken.None
        );

        var excecao = await Assert.ThrowsAsync<ConflitoException>(
            () => servico.CriarAsync(
                new CriarAgendamentoRequest(veiculos[0].Id, NoveDaManha.AddMinutes(15), "Revisao"),
                CancellationToken.None
            )
        );

        Assert.Contains("já tem um agendamento", excecao.Message);
        Assert.Single(agendamentos.Agendamentos);
    }

    [Fact]
    public async Task CriarAsync_aceita_o_mesmo_veiculo_em_horarios_encostados()
    {
        var (servico, veiculos, _) = Montar();
        var primeiro = await servico.CriarAsync(
            new CriarAgendamentoRequest(veiculos[0].Id, NoveDaManha, "TrocaOleo"),
            CancellationToken.None
        );

        var seguinte = await servico.CriarAsync(
            new CriarAgendamentoRequest(veiculos[0].Id, primeiro.Fim, "TrocaOleo"),
            CancellationToken.None
        );

        Assert.Equal(primeiro.Fim, seguinte.Inicio);
    }

    [Fact]
    public async Task CriarAsync_libera_o_horario_do_veiculo_quando_o_anterior_e_cancelado()
    {
        var (servico, veiculos, _) = Montar();
        var primeiro = await servico.CriarAsync(
            new CriarAgendamentoRequest(veiculos[0].Id, NoveDaManha, "TrocaOleo"),
            CancellationToken.None
        );
        await servico.AlterarStatusAsync(
            primeiro.Id,
            new AlterarStatusRequest("Cancelado"),
            CancellationToken.None
        );

        var novo = await servico.CriarAsync(
            new CriarAgendamentoRequest(veiculos[0].Id, NoveDaManha, "TrocaOleo"),
            CancellationToken.None
        );

        Assert.Equal(NoveDaManha, novo.Inicio);
    }

    [Fact]
    public async Task ObterPorIdAsync_devolve_o_detalhe_com_ano_e_contato_do_dono()
    {
        var (servico, veiculos, _) = Montar();
        var criado = await servico.CriarAsync(
            new CriarAgendamentoRequest(veiculos[0].Id, NoveDaManha, "Revisao"),
            CancellationToken.None
        );

        var detalhe = await servico.ObterPorIdAsync(criado.Id, CancellationToken.None);

        Assert.Equal(2021, detalhe.Ano);
        Assert.Equal("11988880001", detalhe.TelefoneDoCliente);
        Assert.Equal("dono@email.com", detalhe.EmailDoCliente);
        Assert.Equal("Revisao", detalhe.TipoServico);
    }

    [Fact]
    public async Task ObterPorIdAsync_recusa_id_inexistente()
    {
        var (servico, _, _) = Montar();

        await Assert.ThrowsAsync<NaoEncontradoException>(
            () => servico.ObterPorIdAsync(Guid.CreateVersion7(), CancellationToken.None)
        );
    }

    [Fact]
    public async Task AlterarStatusAsync_percorre_o_caminho_ate_concluido()
    {
        var (servico, veiculos, _) = Montar();
        var criado = await servico.CriarAsync(
            new CriarAgendamentoRequest(veiculos[0].Id, NoveDaManha, "TrocaOleo"),
            CancellationToken.None
        );

        var emAndamento = await servico.AlterarStatusAsync(
            criado.Id,
            new AlterarStatusRequest("EmAndamento"),
            CancellationToken.None
        );
        var concluido = await servico.AlterarStatusAsync(
            criado.Id,
            new AlterarStatusRequest("Concluido"),
            CancellationToken.None
        );

        Assert.Equal("EmAndamento", emAndamento.Status);
        Assert.Equal("Concluido", concluido.Status);
        Assert.Equal("ABC1234", concluido.Placa);
    }

    [Fact]
    public async Task AlterarStatusAsync_recusa_transicao_que_pula_etapa()
    {
        var (servico, veiculos, _) = Montar();
        var criado = await servico.CriarAsync(
            new CriarAgendamentoRequest(veiculos[0].Id, NoveDaManha, "TrocaOleo"),
            CancellationToken.None
        );

        var excecao = await Assert.ThrowsAsync<DomainException>(
            () => servico.AlterarStatusAsync(
                criado.Id,
                new AlterarStatusRequest("Concluido"),
                CancellationToken.None
            )
        );

        Assert.Contains("Agendado para Concluido", excecao.Message);
    }

    [Fact]
    public async Task AlterarStatusAsync_recusa_voltar_para_agendado()
    {
        var (servico, veiculos, _) = Montar();
        var criado = await servico.CriarAsync(
            new CriarAgendamentoRequest(veiculos[0].Id, NoveDaManha, "TrocaOleo"),
            CancellationToken.None
        );

        var excecao = await Assert.ThrowsAsync<DomainException>(
            () => servico.AlterarStatusAsync(
                criado.Id,
                new AlterarStatusRequest("Agendado"),
                CancellationToken.None
            )
        );

        Assert.Contains("voltar", excecao.Message);
    }

    [Fact]
    public async Task AlterarStatusAsync_recusa_status_desconhecido_antes_de_buscar()
    {
        var (servico, _, _) = Montar();

        var excecao = await Assert.ThrowsAsync<DomainException>(
            () => servico.AlterarStatusAsync(
                Guid.CreateVersion7(),
                new AlterarStatusRequest("Pausado"),
                CancellationToken.None
            )
        );

        Assert.Contains("Agendado, EmAndamento, Concluido, Cancelado", excecao.Message);
    }

    [Fact]
    public async Task AlterarStatusAsync_recusa_id_inexistente()
    {
        var (servico, _, _) = Montar();

        await Assert.ThrowsAsync<NaoEncontradoException>(
            () => servico.AlterarStatusAsync(
                Guid.CreateVersion7(),
                new AlterarStatusRequest("EmAndamento"),
                CancellationToken.None
            )
        );
    }

    [Fact]
    public async Task AlterarStatusAsync_recusa_quando_outra_requisicao_muda_o_status_antes()
    {
        var (servico, veiculos, agendamentos) = Montar();
        var criado = await servico.CriarAsync(
            new CriarAgendamentoRequest(veiculos[0].Id, NoveDaManha, "TrocaOleo"),
            CancellationToken.None
        );

        // Entre a leitura e a gravação, outra requisição cancela o agendamento.
        agendamentos.QuandoForGravar = () =>
            agendamentos.TrocarStatusPorFora(criado.Id, StatusAgendamento.Cancelado);

        var excecao = await Assert.ThrowsAsync<ConflitoException>(
            () => servico.AlterarStatusAsync(
                criado.Id,
                new AlterarStatusRequest("EmAndamento"),
                CancellationToken.None
            )
        );

        Assert.Contains("mudou enquanto", excecao.Message);
        Assert.Equal(StatusAgendamento.Cancelado, agendamentos.Agendamentos[0].Status);
    }

    [Fact]
    public async Task ListarAsync_pagina_e_calcula_o_total_de_paginas()
    {
        var (servico, veiculos, _) = Montar();
        await CriarTres(servico, veiculos);

        var primeira = await servico.ListarAsync(null, null, 1, 2, CancellationToken.None);
        var segunda = await servico.ListarAsync(null, null, 2, 2, CancellationToken.None);

        Assert.Equal(3, primeira.Total);
        Assert.Equal(2, primeira.TotalDePaginas);
        Assert.Equal(2, primeira.Itens.Count);
        Assert.Single(segunda.Itens);
    }

    [Fact]
    public async Task ListarAsync_filtra_por_data_no_fuso_da_oficina()
    {
        var (servico, veiculos, _) = Montar();
        await CriarTres(servico, veiculos);

        var naQuarta = await servico.ListarAsync(
            new DateOnly(2026, 9, 16), null, 1, 10, CancellationToken.None);
        var naQuinta = await servico.ListarAsync(
            new DateOnly(2026, 9, 17), null, 1, 10, CancellationToken.None);

        Assert.Equal(3, naQuarta.Total);
        Assert.Equal(0, naQuinta.Total);
    }

    [Fact]
    public async Task ListarAsync_filtra_por_status()
    {
        var (servico, veiculos, _) = Montar();
        var criados = await CriarTres(servico, veiculos);
        await servico.AlterarStatusAsync(
            criados[0].Id,
            new AlterarStatusRequest("EmAndamento"),
            CancellationToken.None
        );

        var emAndamento = await servico.ListarAsync(
            null, "emandamento", 1, 10, CancellationToken.None);

        Assert.Single(emAndamento.Itens);
        Assert.Equal(criados[0].Id, emAndamento.Itens[0].Id);
    }

    [Fact]
    public async Task ListarAsync_corrige_pagina_e_tamanho_fora_da_faixa()
    {
        var (servico, _, _) = Montar();

        var pagina = await servico.ListarAsync(null, null, 0, 500, CancellationToken.None);

        Assert.Equal(1, pagina.Pagina);
        Assert.Equal(50, pagina.TamanhoDaPagina);
    }

    [Fact]
    public async Task ListarAsync_recusa_status_desconhecido()
    {
        var (servico, _, _) = Montar();

        await Assert.ThrowsAsync<DomainException>(
            () => servico.ListarAsync(null, "Pausado", 1, 10, CancellationToken.None)
        );
    }

    private static async Task<List<AgendamentoResponse>> CriarTres(
        AgendamentoServico servico,
        IReadOnlyList<Veiculo> veiculos
    )
    {
        var criados = new List<AgendamentoResponse>();

        for (var i = 0; i < 3; i++)
        {
            criados.Add(await servico.CriarAsync(
                new CriarAgendamentoRequest(veiculos[i].Id, NoveDaManha, "TrocaOleo"),
                CancellationToken.None
            ));
        }

        return criados;
    }

    private static (
        AgendamentoServico Servico,
        IReadOnlyList<Veiculo> Veiculos,
        AgendamentoRepositorioFalso Agendamentos
    ) Montar()
    {
        var dono = Cliente.Reconstituir(
            Guid.CreateVersion7(),
            "Dono Teste",
            "11988880001",
            "dono@email.com",
            Carimbo,
            Carimbo
        );

        string[] placas = ["ABC1234", "DEF5678", "GHI9012", "JKL3456"];
        string[] modelos = ["Fiat Argo", "Chevrolet Onix", "Hyundai HB20", "Toyota Corolla"];

        var veiculos = placas
            .Select((placa, indice) => Veiculo.Reconstituir(
                Guid.CreateVersion7(),
                dono.Id,
                placa,
                modelos[indice],
                2021,
                Carimbo,
                Carimbo
            ))
            .ToList();

        var agendamentos = new AgendamentoRepositorioFalso(veiculos, [dono]);
        var servico = new AgendamentoServico(
            agendamentos,
            new VeiculoRepositorioFalso(veiculos),
            new RelogioFalso()
        );

        return (servico, veiculos, agendamentos);
    }

    // Relógio fixo: o teste diz em que instante o cenário acontece, em vez de depender de quando roda.
    private sealed class RelogioFalso : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Carimbo;
    }

    private sealed class VeiculoRepositorioFalso : IVeiculoRepositorio
    {
        private readonly IReadOnlyList<Veiculo> _veiculos;

        public VeiculoRepositorioFalso(IReadOnlyList<Veiculo> veiculos)
        {
            _veiculos = veiculos;
        }

        public Task<Veiculo?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken)
        {
            return Task.FromResult(_veiculos.SingleOrDefault(v => v.Id == id));
        }

        public Task<Veiculo> AdicionarAsync(Veiculo veiculo, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<Veiculo>> ListarAsync(CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<Veiculo>> ListarPorClienteAsync(
            Guid clienteId,
            CancellationToken cancellationToken
        ) => throw new NotSupportedException();
    }

    // Imita o que o banco garante: carimbos na gravação e recusa de sobreposição do mesmo veículo.
    private sealed class AgendamentoRepositorioFalso : IAgendamentoRepositorio
    {
        private static readonly TimeZoneInfo Fuso = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

        private readonly IReadOnlyList<Veiculo> _veiculos;
        private readonly IReadOnlyList<Cliente> _clientes;

        public AgendamentoRepositorioFalso(IReadOnlyList<Veiculo> veiculos, IReadOnlyList<Cliente> clientes)
        {
            _veiculos = veiculos;
            _clientes = clientes;
        }

        public List<Agendamento> Agendamentos { get; } = [];

        public Task<AgendamentoNaAgenda> AdicionarAsync(
            Agendamento agendamento,
            CancellationToken cancellationToken
        )
        {
            var sobrepoe = Agendamentos.Any(existente =>
                existente.VeiculoId == agendamento.VeiculoId
                && Ativo(existente)
                && Cruza(existente, agendamento.Inicio, agendamento.Fim)
            );

            if (sobrepoe)
            {
                throw new ConflitoException("Este veículo já tem um agendamento nesse horário.");
            }

            var salvo = Gravar(agendamento);
            Agendamentos.Add(salvo);

            return Task.FromResult(NaAgenda(salvo));
        }

        public Task<AgendamentoDetalhado?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken)
        {
            var encontrado = Agendamentos.SingleOrDefault(a => a.Id == id);

            return Task.FromResult(encontrado is null ? null : Detalhado(Gravar(encontrado)));
        }

        // Chamado no começo da gravação, para o teste encenar outra requisição chegando no meio.
        public Action? QuandoForGravar { get; set; }

        public Task<AgendamentoNaAgenda> AtualizarStatusAsync(
            Agendamento agendamento,
            StatusAgendamento statusAnterior,
            CancellationToken cancellationToken
        )
        {
            QuandoForGravar?.Invoke();

            var indice = Agendamentos.FindIndex(a => a.Id == agendamento.Id);

            if (indice < 0 || Agendamentos[indice].Status != statusAnterior)
            {
                throw new ConflitoException(
                    "O status do agendamento mudou enquanto esta alteração era processada."
                );
            }

            var salvo = Gravar(agendamento);
            Agendamentos[indice] = salvo;

            return Task.FromResult(NaAgenda(salvo));
        }

        // Só para o teste encenar a outra requisição: troca o status guardado sem passar pelo serviço.
        public void TrocarStatusPorFora(Guid id, StatusAgendamento status)
        {
            var indice = Agendamentos.FindIndex(a => a.Id == id);
            var atual = Agendamentos[indice];

            Agendamentos[indice] = Agendamento.Reconstituir(
                atual.Id,
                atual.VeiculoId,
                atual.Inicio,
                atual.Fim,
                atual.TipoServico,
                status,
                Carimbo,
                Carimbo
            );
        }

        public Task<bool> ExisteSobreposicaoDoVeiculoAsync(
            Guid veiculoId,
            DateTimeOffset inicio,
            DateTimeOffset fim,
            CancellationToken cancellationToken
        )
        {
            return Task.FromResult(Agendamentos.Any(a =>
                a.VeiculoId == veiculoId && Ativo(a) && Cruza(a, inicio, fim)
            ));
        }

        public Task<int> ContarAtivosNoPeriodoAsync(
            DateTimeOffset inicio,
            DateTimeOffset fim,
            CancellationToken cancellationToken
        )
        {
            return Task.FromResult(Agendamentos.Count(a => Ativo(a) && Cruza(a, inicio, fim)));
        }

        public Task<Pagina<AgendamentoNaAgenda>> ListarAsync(
            DateOnly? data,
            StatusAgendamento? status,
            int pagina,
            int tamanhoDaPagina,
            CancellationToken cancellationToken
        )
        {
            var filtrados = Agendamentos
                .Where(a => data is null || DateOnly.FromDateTime(NaOficina(a.Inicio)) == data)
                .Where(a => status is null || a.Status == status)
                .OrderBy(a => a.Inicio)
                .ThenBy(a => a.Id)
                .ToList();

            var itens = filtrados
                .Skip((pagina - 1) * tamanhoDaPagina)
                .Take(tamanhoDaPagina)
                .Select(NaAgenda)
                .ToList();

            return Task.FromResult(new Pagina<AgendamentoNaAgenda>(itens, filtrados.Count));
        }

        private static bool Ativo(Agendamento agendamento) =>
            agendamento.Status is StatusAgendamento.Agendado or StatusAgendamento.EmAndamento;

        private static bool Cruza(Agendamento agendamento, DateTimeOffset inicio, DateTimeOffset fim) =>
            agendamento.Inicio < fim && agendamento.Fim > inicio;

        private static DateTime NaOficina(DateTimeOffset instante) =>
            TimeZoneInfo.ConvertTime(instante, Fuso).Date;

        // O banco carimba na gravação, e devolve cópia: mutação na entidade em memória não deve
        // aparecer no repositório antes de ser salva.
        private static Agendamento Gravar(Agendamento agendamento) =>
            Agendamento.Reconstituir(
                agendamento.Id,
                agendamento.VeiculoId,
                agendamento.Inicio,
                agendamento.Fim,
                agendamento.TipoServico,
                agendamento.Status,
                Carimbo,
                Carimbo
            );

        private AgendamentoNaAgenda NaAgenda(Agendamento agendamento)
        {
            var (veiculo, dono) = Donos(agendamento);

            return new AgendamentoNaAgenda(
                agendamento,
                veiculo.Placa.Valor,
                veiculo.Modelo,
                dono.Id,
                dono.Nome
            );
        }

        private AgendamentoDetalhado Detalhado(Agendamento agendamento)
        {
            var (veiculo, dono) = Donos(agendamento);

            return new AgendamentoDetalhado(
                agendamento,
                veiculo.Placa.Valor,
                veiculo.Modelo,
                veiculo.Ano,
                dono.Id,
                dono.Nome,
                dono.Telefone.Valor,
                dono.Email.Valor
            );
        }

        private (Veiculo Veiculo, Cliente Dono) Donos(Agendamento agendamento)
        {
            var veiculo = _veiculos.Single(v => v.Id == agendamento.VeiculoId);

            return (veiculo, _clientes.Single(c => c.Id == veiculo.ClienteId));
        }
    }
}

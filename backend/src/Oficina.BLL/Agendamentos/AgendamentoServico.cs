using Oficina.Domain.Entities;
using Oficina.Domain.Enums;
using Oficina.Domain.Exceptions;
using Oficina.Domain.Repositories;
using Oficina.DTO;
using Oficina.DTO.Agendamentos;

namespace Oficina.BLL.Agendamentos;

public sealed class AgendamentoServico
{
    // Capacidade é a única regra que precisa perguntar ao banco quantos já existem, e por isso
    // fica aqui: na entidade, ela obrigaria o domínio a conhecer repositório.
    private const int MaximoDeServicosSimultaneos = 3;

    // Teto para ninguém pedir a agenda inteira numa página só.
    private const int TamanhoMaximoDaPagina = 50;

    private readonly IAgendamentoRepositorio _agendamentos;
    private readonly IVeiculoRepositorio _veiculos;
    private readonly TimeProvider _relogio;

    public AgendamentoServico(
        IAgendamentoRepositorio agendamentos,
        IVeiculoRepositorio veiculos,
        TimeProvider relogio
    )
    {
        _agendamentos = agendamentos;
        _veiculos = veiculos;
        _relogio = relogio;
    }

    public async Task<AgendamentoResponse> CriarAsync(
        CriarAgendamentoRequest request,
        CancellationToken cancellationToken
    )
    {
        // Antes de tudo: sem o veículo, a chave estrangeira estouraria com erro cru,
        // e o 404 do veículo inexistente deve ganhar do 400 de dado inválido.
        await GarantirQueOVeiculoExiste(request.VeiculoId, cancellationToken);

        var tipoServico = Converter<TipoServico>(request.TipoServico, "Tipo de serviço");

        var agendamento = Agendamento.Criar(
            request.VeiculoId,
            request.Inicio,
            tipoServico,
            _relogio.GetUtcNow()
        );

        await GarantirQueOVeiculoEstaLivre(agendamento, cancellationToken);
        await GarantirQueCabeNaCapacidade(agendamento, cancellationToken);

        var salvo = await _agendamentos.AdicionarAsync(agendamento, cancellationToken);

        return Mapear(salvo);
    }

    public async Task<AgendamentoDetalheResponse> ObterPorIdAsync(
        Guid id,
        CancellationToken cancellationToken
    )
    {
        var detalhe = await _agendamentos.ObterPorIdAsync(id, cancellationToken);

        if (detalhe is null)
        {
            throw new NaoEncontradoException("Agendamento não encontrado.");
        }

        return Mapear(detalhe);
    }

    public async Task<AgendamentoResponse> AlterarStatusAsync(
        Guid id,
        AlterarStatusRequest request,
        CancellationToken cancellationToken
    )
    {
        var novoStatus = Converter<StatusAgendamento>(request.Status, "Status");

        var detalhe = await _agendamentos.ObterPorIdAsync(id, cancellationToken);

        if (detalhe is null)
        {
            throw new NaoEncontradoException("Agendamento não encontrado.");
        }

        var agendamento = detalhe.Agendamento;

        // Guardado antes da transição: é ele que o banco vai conferir na hora de gravar.
        var statusLido = agendamento.Status;

        // O status pedido escolhe a transição; quem recusa a que não faz sentido é a entidade,
        // que conhece o status atual. Voltar para Agendado não existe, então nem chega nela.
        switch (novoStatus)
        {
            case StatusAgendamento.EmAndamento:
                agendamento.Iniciar();
                break;
            case StatusAgendamento.Concluido:
                agendamento.Concluir();
                break;
            case StatusAgendamento.Cancelado:
                agendamento.Cancelar(_relogio.GetUtcNow());
                break;
            default:
                throw new DomainException("Não é possível voltar um agendamento para Agendado.");
        }

        var salvo = await _agendamentos.AtualizarStatusAsync(agendamento, statusLido, cancellationToken);

        return Mapear(salvo);
    }

    public async Task<PaginaResponse<AgendamentoResponse>> ListarAsync(
        DateOnly? dataInicio,
        DateOnly? dataFim,
        string? status,
        int pagina,
        int tamanhoDaPagina,
        CancellationToken cancellationToken
    )
    {
        var filtro = string.IsNullOrWhiteSpace(status)
            ? (StatusAgendamento?)null
            : Converter<StatusAgendamento>(status, "Status");

        if (dataInicio is not null && dataFim is not null && dataFim < dataInicio)
        {
            throw new DomainException("A data final não pode ser anterior à data inicial.");
        }

        // As datas viram uma faixa meia-aberta de instantes: da meia-noite do primeiro dia até a
        // meia-noite do dia seguinte ao último, no fuso da oficina. Assim o último dia entra
        // inteiro, e um dia só é pedir a mesma data nas duas pontas.
        var de = dataInicio is null ? (DateTimeOffset?)null : Agendamento.InicioDoDia(dataInicio.Value);
        var ate = dataFim is null ? (DateTimeOffset?)null : Agendamento.InicioDoDia(dataFim.Value.AddDays(1));

        // Corrigir em vez de recusar: página fora da faixa é erro de navegação, não de intenção.
        pagina = Math.Max(pagina, 1);
        tamanhoDaPagina = Math.Clamp(tamanhoDaPagina, 1, TamanhoMaximoDaPagina);

        var resultado = await _agendamentos.ListarAsync(
            de,
            ate,
            filtro,
            pagina,
            tamanhoDaPagina,
            cancellationToken
        );

        return new PaginaResponse<AgendamentoResponse>(
            resultado.Itens.Select(Mapear).ToList(),
            pagina,
            tamanhoDaPagina,
            resultado.Total,
            (int)Math.Ceiling(resultado.Total / (double)tamanhoDaPagina)
        );
    }

    private async Task GarantirQueOVeiculoExiste(Guid veiculoId, CancellationToken cancellationToken)
    {
        if (await _veiculos.ObterPorIdAsync(veiculoId, cancellationToken) is null)
        {
            throw new NaoEncontradoException("Veículo não encontrado.");
        }
    }

    // Regra: o mesmo veículo não pode ter dois agendamentos sobrepostos. Entre esta consulta e a
    // gravação ainda cabe outra requisição, e é a constraint de exclusão do banco que fecha essa
    // janela. A checagem existe para a regra viver aqui, junto das outras, e recusar antes de gravar.
    private async Task GarantirQueOVeiculoEstaLivre(
        Agendamento agendamento,
        CancellationToken cancellationToken
    )
    {
        var ocupado = await _agendamentos.ExisteSobreposicaoDoVeiculoAsync(
            agendamento.VeiculoId,
            agendamento.Inicio,
            agendamento.Fim,
            cancellationToken
        );

        if (ocupado)
        {
            throw new ConflitoException("Este veículo já tem um agendamento nesse horário.");
        }
    }

    // Capacidade tem a mesma corrida, e nela o banco não ajuda: não existe constraint declarativa
    // para "no máximo três ao mesmo tempo". Resolver exigiria lock.
    private async Task GarantirQueCabeNaCapacidade(
        Agendamento agendamento,
        CancellationToken cancellationToken
    )
    {
        var ocupados = await _agendamentos.ContarAtivosNoPeriodoAsync(
            agendamento.Inicio,
            agendamento.Fim,
            cancellationToken
        );

        if (ocupados >= MaximoDeServicosSimultaneos)
        {
            throw new ConflitoException(
                $"A oficina já tem {MaximoDeServicosSimultaneos} serviços nesse horário."
            );
        }
    }

    // Enum.TryParse aceitaria "1" como se fosse nome; o contrato da API é texto, então só o nome vale.
    private static T Converter<T>(string? valor, string campo) where T : struct, Enum
    {
        var nome = Enum.GetNames<T>()
            .FirstOrDefault(candidato => string.Equals(candidato, valor, StringComparison.OrdinalIgnoreCase));

        if (nome is null)
        {
            throw new DomainException(
                $"{campo} inválido. Valores aceitos: {string.Join(", ", Enum.GetNames<T>())}."
            );
        }

        return Enum.Parse<T>(nome);
    }

    // Os carimbos só são nulos antes de gravar, e tudo que chega aqui já veio do banco.
    private static AgendamentoResponse Mapear(AgendamentoNaAgenda agenda)
    {
        var agendamento = agenda.Agendamento;

        return new AgendamentoResponse(
            agendamento.Id,
            agendamento.VeiculoId,
            agenda.Placa,
            agenda.Modelo,
            agenda.ClienteId,
            agenda.NomeDoCliente,
            agendamento.Inicio,
            agendamento.Fim,
            agendamento.TipoServico.ToString(),
            agendamento.Status.ToString(),
            agendamento.CriadoEm!.Value,
            agendamento.AtualizadoEm!.Value
        );
    }

    private static AgendamentoDetalheResponse Mapear(AgendamentoDetalhado detalhe)
    {
        var agendamento = detalhe.Agendamento;

        return new AgendamentoDetalheResponse(
            agendamento.Id,
            agendamento.VeiculoId,
            detalhe.Placa,
            detalhe.Modelo,
            detalhe.Ano,
            detalhe.ClienteId,
            detalhe.NomeDoCliente,
            detalhe.TelefoneDoCliente,
            detalhe.EmailDoCliente,
            agendamento.Inicio,
            agendamento.Fim,
            agendamento.TipoServico.ToString(),
            agendamento.Status.ToString(),
            agendamento.CriadoEm!.Value,
            agendamento.AtualizadoEm!.Value
        );
    }
}

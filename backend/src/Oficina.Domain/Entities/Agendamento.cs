using Oficina.Domain.Enums;
using Oficina.Domain.Exceptions;

namespace Oficina.Domain.Entities;

public sealed class Agendamento
{
    // Horário de funcionamento é hora da oficina, e tudo é guardado em UTC: sem converter,
    // 22:00 de sexta em Brasília seria sábado em UTC e a regra olharia o dia errado.
    // Constante por ora; o certo seria atributo da unidade, já que o Brasil tem quatro fusos.
    private const string FusoDaOficina = "America/Sao_Paulo";

    private static readonly TimeSpan Abertura = new(8, 0, 0);
    private static readonly TimeSpan FechamentoEmDiaUtil = new(18, 0, 0);
    private static readonly TimeSpan FechamentoNoSabado = new(12, 0, 0);

    private static readonly TimeSpan AntecedenciaMinimaParaCancelar = TimeSpan.FromHours(2);

    public Guid Id { get; }
    public Guid VeiculoId { get; }
    public DateTimeOffset Inicio { get; }
    public DateTimeOffset Fim { get; }
    public TipoServico TipoServico { get; }

    // Único campo que muda depois de criado, e só pelos três métodos de transição.
    public StatusAgendamento Status { get; private set; }

    // Nulos até ser gravado: quem define os instantes é o banco, por DEFAULT now() e por gatilho.
    public DateTimeOffset? CriadoEm { get; }
    public DateTimeOffset? AtualizadoEm { get; }

    private Agendamento(
        Guid id,
        Guid veiculoId,
        DateTimeOffset inicio,
        DateTimeOffset fim,
        TipoServico tipoServico,
        StatusAgendamento status,
        DateTimeOffset? criadoEm,
        DateTimeOffset? atualizadoEm
    )
    {
        Id = id;
        VeiculoId = veiculoId;
        Inicio = inicio;
        Fim = fim;
        TipoServico = tipoServico;
        Status = status;
        CriadoEm = criadoEm;
        AtualizadoEm = atualizadoEm;
    }

    // O fim é calculado a partir da duração do tipo, nunca informado: assim ele não pode divergir.
    public static Agendamento Criar(
        Guid veiculoId,
        DateTimeOffset inicio,
        TipoServico tipoServico,
        DateTimeOffset agora
    )
    {
        if (veiculoId == Guid.Empty)
        {
            throw new DomainException("Veículo é obrigatório.");
        }

        var inicioUtc = inicio.ToUniversalTime();
        var fimUtc = inicioUtc + tipoServico.Duracao();

        GarantirQueNaoEstaNoPassado(inicioUtc, agora);
        GarantirQueCabeNoHorarioDeFuncionamento(inicioUtc, fimUtc);

        return new Agendamento(
            Guid.CreateVersion7(),
            veiculoId,
            inicioUtc,
            fimUtc,
            tipoServico,
            StatusAgendamento.Agendado,
            criadoEm: null,
            atualizadoEm: null
        );
    }

    // Sem revalidar: o banco é a fonte e já tem as restrições. Regra que apertar depois não pode
    // impedir a leitura de linha antiga, e um agendamento passado continua legível para sempre.
    public static Agendamento Reconstituir(
        Guid id,
        Guid veiculoId,
        DateTimeOffset inicio,
        DateTimeOffset fim,
        TipoServico tipoServico,
        StatusAgendamento status,
        DateTimeOffset criadoEm,
        DateTimeOffset atualizadoEm
    )
    {
        return new Agendamento(
            id,
            veiculoId,
            inicio.ToUniversalTime(),
            fim.ToUniversalTime(),
            tipoServico,
            status,
            criadoEm.ToUniversalTime(),
            atualizadoEm.ToUniversalTime()
        );
    }

    public void Iniciar()
    {
        GarantirTransicao(de: StatusAgendamento.Agendado, para: StatusAgendamento.EmAndamento);

        Status = StatusAgendamento.EmAndamento;
    }

    public void Concluir()
    {
        GarantirTransicao(de: StatusAgendamento.EmAndamento, para: StatusAgendamento.Concluido);

        Status = StatusAgendamento.Concluido;
    }

    public void Cancelar(DateTimeOffset agora)
    {
        GarantirTransicao(de: StatusAgendamento.Agendado, para: StatusAgendamento.Cancelado);

        if (Inicio - agora.ToUniversalTime() < AntecedenciaMinimaParaCancelar)
        {
            throw new DomainException("O cancelamento só é permitido até 2 horas antes do início.");
        }

        Status = StatusAgendamento.Cancelado;
    }

    private void GarantirTransicao(StatusAgendamento de, StatusAgendamento para)
    {
        if (Status != de)
        {
            throw new DomainException($"Não é possível mudar de {Status} para {para}.");
        }
    }

    private static void GarantirQueNaoEstaNoPassado(DateTimeOffset inicio, DateTimeOffset agora)
    {
        if (inicio < agora.ToUniversalTime())
        {
            throw new DomainException("Não é possível agendar no passado.");
        }
    }

    private static void GarantirQueCabeNoHorarioDeFuncionamento(DateTimeOffset inicio, DateTimeOffset fim)
    {
        var fuso = TimeZoneInfo.FindSystemTimeZoneById(FusoDaOficina);
        var inicioLocal = TimeZoneInfo.ConvertTime(inicio, fuso);
        var fimLocal = TimeZoneInfo.ConvertTime(fim, fuso);

        var fechamento = FechamentoDe(inicioLocal.DayOfWeek);

        // O fim é inclusivo: terminar exatamente no horário de fechar é aceito, senão a oficina
        // teria de parar de agendar antes de fechar. O serviço inteiro precisa caber no mesmo dia.
        var cabe = fechamento is not null
            && inicioLocal.TimeOfDay >= Abertura
            && fimLocal.Date == inicioLocal.Date
            && fimLocal.TimeOfDay <= fechamento;

        if (!cabe)
        {
            throw new DomainException(
                "A oficina atende de segunda a sexta das 08:00 às 18:00 e sábado das 08:00 às 12:00, "
                + "e o serviço inteiro precisa terminar dentro do horário."
            );
        }
    }

    // Nulo quando a oficina não abre naquele dia.
    private static TimeSpan? FechamentoDe(DayOfWeek dia) => dia switch
    {
        DayOfWeek.Sunday => null,
        DayOfWeek.Saturday => FechamentoNoSabado,
        _ => FechamentoEmDiaUtil
    };
}

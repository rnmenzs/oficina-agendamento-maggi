using Oficina.Domain.Entities;
using Oficina.Domain.Enums;
using Oficina.Domain.Exceptions;

namespace Oficina.Tests.Domain.Entities;

public class AgendamentoTests
{
    // Terça-feira, 10:00 no fuso da oficina. Tudo no arquivo é relativo a este instante,
    // então os cenários continuam significando a mesma coisa em qualquer data de execução.
    private static readonly DateTimeOffset Agora = EmBrasilia(2026, 9, 15, 10, 0);

    private static DateTimeOffset EmBrasilia(int ano, int mes, int dia, int hora, int minuto) =>
        new(ano, mes, dia, hora, minuto, 0, TimeSpan.FromHours(-3));

    [Fact]
    public void Criar_calcula_o_fim_pela_duracao_do_tipo()
    {
        var inicio = EmBrasilia(2026, 9, 15, 14, 0);

        var agendamento = Agendamento.Criar(Guid.CreateVersion7(), inicio, TipoServico.Diagnostico, Agora);

        Assert.Equal(inicio.UtcDateTime, agendamento.Inicio.UtcDateTime);
        Assert.Equal(inicio.AddMinutes(90).UtcDateTime, agendamento.Fim.UtcDateTime);
        Assert.Equal(StatusAgendamento.Agendado, agendamento.Status);
    }

    [Fact]
    public void Criar_recusa_veiculo_vazio()
    {
        var excecao = Assert.Throws<DomainException>(
            () => Agendamento.Criar(Guid.Empty, EmBrasilia(2026, 9, 15, 14, 0), TipoServico.Revisao, Agora)
        );

        Assert.Contains("Veículo é obrigatório", excecao.Message);
    }

    // Regra 1
    [Fact]
    public void Criar_recusa_agendamento_no_passado()
    {
        var umaHoraAtras = EmBrasilia(2026, 9, 15, 9, 0);

        var excecao = Assert.Throws<DomainException>(
            () => Agendamento.Criar(Guid.CreateVersion7(), umaHoraAtras, TipoServico.TrocaOleo, Agora)
        );

        Assert.Contains("passado", excecao.Message);
    }

    // Regra 2
    [Theory]
    // Quarta, começa antes de abrir. Dia seguinte porque às 07:30 de hoje já é passado.
    [InlineData(2026, 9, 16, 7, 30, TipoServico.TrocaOleo)]
    // Terça, começa dentro mas termina depois das 18:00.
    [InlineData(2026, 9, 15, 17, 30, TipoServico.Revisao)]
    // Sábado, começa dentro mas passa das 12:00.
    [InlineData(2026, 9, 19, 11, 45, TipoServico.TrocaOleo)]
    // Domingo, fechado o dia inteiro.
    [InlineData(2026, 9, 20, 10, 0, TipoServico.TrocaOleo)]
    public void Criar_recusa_fora_do_horario_de_funcionamento(
        int ano,
        int mes,
        int dia,
        int hora,
        int minuto,
        TipoServico tipo
    )
    {
        var inicio = EmBrasilia(ano, mes, dia, hora, minuto);

        var excecao = Assert.Throws<DomainException>(
            () => Agendamento.Criar(Guid.CreateVersion7(), inicio, tipo, Agora)
        );

        Assert.Contains("horário", excecao.Message);
    }

    [Theory]
    // Quarta, exatamente na abertura. Dia seguinte porque às 08:00 de hoje já é passado.
    [InlineData(2026, 9, 16, 8, 0, TipoServico.Diagnostico)]
    // Terça, terminando exatamente às 18:00.
    [InlineData(2026, 9, 15, 17, 0, TipoServico.Revisao)]
    // Sábado, terminando exatamente às 12:00.
    [InlineData(2026, 9, 19, 11, 30, TipoServico.TrocaOleo)]
    public void Criar_aceita_servico_que_cabe_no_horario(
        int ano,
        int mes,
        int dia,
        int hora,
        int minuto,
        TipoServico tipo
    )
    {
        var inicio = EmBrasilia(ano, mes, dia, hora, minuto);

        var agendamento = Agendamento.Criar(Guid.CreateVersion7(), inicio, tipo, Agora);

        Assert.Equal(inicio.UtcDateTime, agendamento.Inicio.UtcDateTime);
    }

    [Fact]
    public void Criar_recusa_horario_que_parece_valido_em_utc_mas_nao_no_fuso_da_oficina()
    {
        // 22:00 de sexta em Brasília é 01:00 de sábado em UTC. Olhando o fuso errado,
        // a regra acharia que é sábado de manhã e aceitaria.
        var sextaTardeDaNoite = EmBrasilia(2026, 9, 18, 22, 0);

        Assert.Throws<DomainException>(
            () => Agendamento.Criar(Guid.CreateVersion7(), sextaTardeDaNoite, TipoServico.TrocaOleo, Agora)
        );
    }

    // Regra 5
    [Fact]
    public void Iniciar_move_de_agendado_para_em_andamento()
    {
        var agendamento = AgendamentoValido();

        agendamento.Iniciar();

        Assert.Equal(StatusAgendamento.EmAndamento, agendamento.Status);
    }

    [Fact]
    public void Concluir_move_de_em_andamento_para_concluido()
    {
        var agendamento = AgendamentoValido();
        agendamento.Iniciar();

        agendamento.Concluir();

        Assert.Equal(StatusAgendamento.Concluido, agendamento.Status);
    }

    [Fact]
    public void Concluir_recusa_quem_ainda_nao_comecou()
    {
        var agendamento = AgendamentoValido();

        var excecao = Assert.Throws<DomainException>(() => agendamento.Concluir());

        Assert.Contains("Agendado", excecao.Message);
    }

    [Fact]
    public void Iniciar_recusa_quem_ja_comecou()
    {
        var agendamento = AgendamentoValido();
        agendamento.Iniciar();

        Assert.Throws<DomainException>(() => agendamento.Iniciar());
    }

    [Fact]
    public void Cancelar_recusa_servico_que_ja_comecou()
    {
        var agendamento = AgendamentoValido();
        agendamento.Iniciar();

        var excecao = Assert.Throws<DomainException>(() => agendamento.Cancelar(Agora));

        Assert.Contains("EmAndamento", excecao.Message);
    }

    [Fact]
    public void Concluido_nao_volta_atras()
    {
        var agendamento = AgendamentoValido();
        agendamento.Iniciar();
        agendamento.Concluir();

        Assert.Throws<DomainException>(() => agendamento.Iniciar());
        Assert.Throws<DomainException>(() => agendamento.Cancelar(Agora));
    }

    // Regra 6
    [Fact]
    public void Cancelar_permite_com_mais_de_duas_horas_de_antecedencia()
    {
        var agendamento = AgendamentoValido();

        agendamento.Cancelar(Agora);

        Assert.Equal(StatusAgendamento.Cancelado, agendamento.Status);
    }

    [Fact]
    public void Cancelar_permite_exatamente_duas_horas_antes()
    {
        var agendamento = AgendamentoValido();
        var duasHorasAntes = agendamento.Inicio.AddHours(-2);

        agendamento.Cancelar(duasHorasAntes);

        Assert.Equal(StatusAgendamento.Cancelado, agendamento.Status);
    }

    [Fact]
    public void Cancelar_recusa_com_menos_de_duas_horas()
    {
        var agendamento = AgendamentoValido();
        var umaHoraAntes = agendamento.Inicio.AddHours(-1);

        var excecao = Assert.Throws<DomainException>(() => agendamento.Cancelar(umaHoraAntes));

        Assert.Contains("2 horas", excecao.Message);
    }

    [Fact]
    public void Reconstituir_aceita_agendamento_passado_que_a_criacao_recusaria()
    {
        // O banco é a fonte: agendamento antigo precisa continuar legível para sempre.
        var inicio = EmBrasilia(2020, 1, 6, 9, 0);

        var agendamento = Agendamento.Reconstituir(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            inicio,
            inicio.AddMinutes(30),
            TipoServico.TrocaOleo,
            StatusAgendamento.Concluido,
            Agora,
            Agora
        );

        Assert.Equal(StatusAgendamento.Concluido, agendamento.Status);
        Assert.Equal(TimeSpan.Zero, agendamento.CriadoEm!.Value.Offset);
    }

    [Fact]
    public void Criar_deixa_os_carimbos_nulos_porque_quem_define_e_o_banco()
    {
        var agendamento = AgendamentoValido();

        Assert.Null(agendamento.CriadoEm);
        Assert.Null(agendamento.AtualizadoEm);
    }

    // Terça às 14:00, bem dentro do expediente e quatro horas à frente do instante de referência.
    private static Agendamento AgendamentoValido() =>
        Agendamento.Criar(Guid.CreateVersion7(), EmBrasilia(2026, 9, 15, 14, 0), TipoServico.Revisao, Agora);
}

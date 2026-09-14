using Oficina.Domain.Enums;

namespace Oficina.Tests.Domain.Enums;

public class StatusAgendamentoTests
{
    [Fact]
    public void Nomes_batem_com_o_check_do_banco()
    {
        var esperados = new[] { "Agendado", "EmAndamento", "Concluido", "Cancelado" };

        Assert.Equal(esperados, Enum.GetNames<StatusAgendamento>());
    }
}

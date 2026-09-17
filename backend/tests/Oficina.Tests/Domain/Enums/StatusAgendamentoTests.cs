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

    // Os rótulos são os mesmos que o frontend mostra nos selos (STATUS_LABEL): a frase da API e a
    // tela falam do mesmo estado com as mesmas palavras.
    [Theory]
    [InlineData(StatusAgendamento.Agendado, "Agendado")]
    [InlineData(StatusAgendamento.EmAndamento, "Em andamento")]
    [InlineData(StatusAgendamento.Concluido, "Concluído")]
    [InlineData(StatusAgendamento.Cancelado, "Cancelado")]
    public void Rotulo_e_o_que_a_pessoa_le(StatusAgendamento status, string rotulo)
    {
        Assert.Equal(rotulo, status.Rotulo());
    }
}

using Oficina.Domain.Enums;

namespace Oficina.Tests.Domain.Enums;

public class TipoServicoTests
{
    [Theory]
    [InlineData(TipoServico.TrocaOleo, 30)]
    [InlineData(TipoServico.Revisao, 60)]
    [InlineData(TipoServico.Diagnostico, 90)]
    public void Duracao_segue_a_tabela_do_enunciado(TipoServico tipo, int minutos)
    {
        Assert.Equal(TimeSpan.FromMinutes(minutos), tipo.Duracao());
    }

    [Fact]
    public void Duracao_recusa_valor_fora_do_enum()
    {
        var tipoInvalido = (TipoServico)99;

        Assert.Throws<ArgumentOutOfRangeException>(() => tipoInvalido.Duracao());
    }

    [Fact]
    public void Todo_tipo_de_servico_tem_duracao_positiva()
    {
        foreach (var tipo in Enum.GetValues<TipoServico>())
        {
            Assert.True(tipo.Duracao() > TimeSpan.Zero, $"{tipo} sem duração definida.");
        }
    }

    [Fact]
    public void Nomes_batem_com_o_check_do_banco()
    {
        var esperados = new[] { "TrocaOleo", "Revisao", "Diagnostico" };

        Assert.Equal(esperados, Enum.GetNames<TipoServico>());
    }
}

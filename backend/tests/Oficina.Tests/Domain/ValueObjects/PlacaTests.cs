using Oficina.Domain.Exceptions;
using Oficina.Domain.ValueObjects;

namespace Oficina.Tests.Domain.ValueObjects;

public class PlacaTests
{
    [Theory]
    [InlineData("ABC-1234", "ABC1234")]
    [InlineData("abc-1234", "ABC1234")]
    [InlineData("ABC1234", "ABC1234")]
    [InlineData("  ABC-1234  ", "ABC1234")]
    [InlineData("ABC1D23", "ABC1D23")]
    [InlineData("abc1d23", "ABC1D23")]
    public void Criar_aceita_formato_antigo_e_mercosul_e_normaliza(string entrada, string esperado)
    {
        var placa = Placa.Criar(entrada);

        Assert.Equal(esperado, placa.Valor);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Criar_recusa_placa_vazia(string? entrada)
    {
        var excecao = Assert.Throws<DomainException>(() => Placa.Criar(entrada));

        Assert.Contains("obrigatória", excecao.Message);
    }

    [Theory]
    [InlineData("AB-1234")]
    [InlineData("ABCD-123")]
    [InlineData("ABC-12345")]
    [InlineData("ABC-1D23")]
    [InlineData("ABC1DE3")]
    [InlineData("1234ABC")]
    [InlineData("ABC 1234")]
    [InlineData("ABC12-34")]
    [InlineData("ABC--1234")]
    public void Criar_recusa_formato_invalido(string entrada)
    {
        var excecao = Assert.Throws<DomainException>(() => Placa.Criar(entrada));

        Assert.Contains("Placa inválida", excecao.Message);
    }

    [Theory]
    [InlineData("ABC1234", "ABC-1234")]
    [InlineData("ABC1D23", "ABC1D23")]
    public void Formatada_usa_hifen_apenas_no_formato_antigo(string entrada, string esperado)
    {
        var placa = Placa.Criar(entrada);

        Assert.Equal(esperado, placa.Formatada);
    }

    [Fact]
    public void Placas_com_o_mesmo_valor_sao_iguais()
    {
        Assert.Equal(Placa.Criar("ABC-1234"), Placa.Criar("abc1234"));
    }
}

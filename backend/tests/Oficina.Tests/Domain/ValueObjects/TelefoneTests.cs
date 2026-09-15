using Oficina.Domain.Exceptions;
using Oficina.Domain.ValueObjects;

namespace Oficina.Tests.Domain.ValueObjects;

public class TelefoneTests
{
    [Theory]
    [InlineData("(11) 98888-0001", "11988880001")]
    [InlineData("11 98888-0001", "11988880001")]
    [InlineData("11988880001", "11988880001")]
    [InlineData("  (21) 96666-0003  ", "21966660003")]
    [InlineData("(11) 3888-0001", "1138880001")]
    [InlineData("+55 11 98888-0001", "11988880001")]
    [InlineData("5511988880001", "11988880001")]
    [InlineData("+55 (11) 3888-0001", "1138880001")]
    public void Criar_aceita_telefone_valido_e_guarda_so_digitos(string entrada, string esperado)
    {
        var telefone = Telefone.Criar(entrada);

        Assert.Equal(esperado, telefone.Valor);
    }

    [Fact]
    public void Criar_nao_confunde_ddd_55_com_codigo_de_pais()
    {
        var telefone = Telefone.Criar("(55) 99999-8888");

        Assert.Equal("55999998888", telefone.Valor);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Criar_recusa_telefone_vazio(string? entrada)
    {
        var excecao = Assert.Throws<DomainException>(() => Telefone.Criar(entrada));

        Assert.Contains("obrigatório", excecao.Message);
    }

    [Theory]
    [InlineData("abc")]
    [InlineData("988880001")]
    [InlineData("(01) 98888-0001")]
    [InlineData("(10) 98888-0001")]
    [InlineData("(11) 18888-0001")]
    [InlineData("1198888000")]
    [InlineData("119888800012")]
    public void Criar_recusa_formato_invalido(string entrada)
    {
        var excecao = Assert.Throws<DomainException>(() => Telefone.Criar(entrada));

        Assert.Contains("inválido", excecao.Message);
    }

    [Fact]
    public void Telefones_com_o_mesmo_valor_sao_iguais()
    {
        Assert.Equal(Telefone.Criar("(11) 98888-0001"), Telefone.Criar("11988880001"));
    }
}

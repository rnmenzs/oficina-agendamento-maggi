using Oficina.Domain.Exceptions;
using Oficina.Domain.ValueObjects;

namespace Oficina.Tests.Domain.ValueObjects;

public class EmailTests
{
    [Theory]
    [InlineData("ana@email.com", "ana@email.com")]
    [InlineData("  Ana@Email.COM  ", "ana@email.com")]
    [InlineData("a.b+c@sub.dominio.com.br", "a.b+c@sub.dominio.com.br")]
    public void Criar_aceita_email_valido_e_normaliza(string entrada, string esperado)
    {
        var email = Email.Criar(entrada);

        Assert.Equal(esperado, email.Valor);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Criar_recusa_email_vazio(string? entrada)
    {
        var excecao = Assert.Throws<DomainException>(() => Email.Criar(entrada));

        Assert.Contains("obrigatório", excecao.Message);
    }

    [Fact]
    public void Criar_recusa_email_acima_do_tamanho_maximo()
    {
        var entrada = new string('a', 243) + "@dominio.com";

        var excecao = Assert.Throws<DomainException>(() => Email.Criar(entrada));

        Assert.Contains("254", excecao.Message);
    }

    [Theory]
    [InlineData("semarroba.com")]
    [InlineData("@dominio.com")]
    [InlineData("ana@")]
    [InlineData("ana@dominio")]
    [InlineData("ana @dominio.com")]
    [InlineData("ana@@dominio.com")]
    public void Criar_recusa_formato_invalido(string entrada)
    {
        var excecao = Assert.Throws<DomainException>(() => Email.Criar(entrada));

        Assert.Contains("inválido", excecao.Message);
    }

    [Fact]
    public void Emails_com_o_mesmo_valor_sao_iguais()
    {
        Assert.Equal(Email.Criar("Ana@Email.com"), Email.Criar("ana@email.com"));
    }
}

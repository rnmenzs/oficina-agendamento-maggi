using Oficina.Domain.Entities;
using Oficina.Domain.Exceptions;

namespace Oficina.Tests.Domain.Entities;

public class ClienteTests
{
    private static readonly DateTimeOffset Agora = new(2026, 9, 14, 12, 0, 0, TimeSpan.FromHours(-3));

    [Fact]
    public void Criar_monta_cliente_com_os_valores_normalizados()
    {
        var cliente = Cliente.Criar("  Ana Souza  ", "(11) 98888-0001", "  Ana@Email.COM ");

        Assert.Equal("Ana Souza", cliente.Nome);
        Assert.Equal("11988880001", cliente.Telefone.Valor);
        Assert.Equal("ana@email.com", cliente.Email.Valor);
    }

    [Fact]
    public void Criar_gera_id_proprio_na_versao_7()
    {
        var primeiro = Cliente.Criar("Ana", "11988880001", "ana@email.com");
        var segundo = Cliente.Criar("Bruno", "11977770002", "bruno@email.com");

        Assert.NotEqual(Guid.Empty, primeiro.Id);
        Assert.NotEqual(primeiro.Id, segundo.Id);
        Assert.Equal(7, primeiro.Id.Version);
        Assert.Equal(7, segundo.Id.Version);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Criar_recusa_nome_vazio(string? nome)
    {
        var excecao = Assert.Throws<DomainException>(
            () => Cliente.Criar(nome, "11988880001", "ana@email.com"));

        Assert.Contains("obrigatório", excecao.Message);
    }

    [Fact]
    public void Criar_recusa_nome_acima_do_tamanho_da_coluna()
    {
        var nome = new string('a', 151);

        var excecao = Assert.Throws<DomainException>(
            () => Cliente.Criar(nome, "11988880001", "ana@email.com"));

        Assert.Contains("150", excecao.Message);
    }

    [Theory]
    [InlineData("123", "ana@email.com", "Telefone")]
    [InlineData("11988880001", "sem-arroba", "Email")]
    public void Criar_propaga_a_validacao_dos_value_objects(string telefone, string email, string esperado)
    {
        var excecao = Assert.Throws<DomainException>(
            () => Cliente.Criar("Ana", telefone, email));

        Assert.Contains(esperado, excecao.Message);
    }

    [Fact]
    public void Criar_deixa_os_carimbos_nulos_porque_quem_define_e_o_banco()
    {
        var cliente = Cliente.Criar("Ana", "11988880001", "ana@email.com");

        Assert.Null(cliente.CriadoEm);
        Assert.Null(cliente.AtualizadoEm);
    }

    [Fact]
    public void Reconstituir_preserva_o_id_vindo_do_banco()
    {
        var id = Guid.CreateVersion7();

        var cliente = Cliente.Reconstituir(
            id,
            "Ana Souza",
            "11988880001",
            "ana@email.com",
            Agora,
            Agora
        );

        Assert.Equal(id, cliente.Id);
    }

    [Fact]
    public void Reconstituir_converte_os_carimbos_para_utc()
    {
        var cliente = Cliente.Reconstituir(
            Guid.CreateVersion7(),
            "Ana",
            "11988880001",
            "ana@email.com",
            Agora,
            Agora
        );

        Assert.Equal(TimeSpan.Zero, cliente.CriadoEm!.Value.Offset);
        Assert.Equal(Agora.UtcDateTime, cliente.CriadoEm.Value.UtcDateTime);
        Assert.Equal(TimeSpan.Zero, cliente.AtualizadoEm!.Value.Offset);
    }

    [Fact]
    public void Clientes_com_os_mesmos_dados_continuam_sendo_clientes_diferentes()
    {
        var primeiro = Cliente.Criar("Ana", "11988880001", "ana@email.com");
        var segundo = Cliente.Reconstituir(
            primeiro.Id,
            "Ana",
            "11988880001",
            "ana@email.com",
            Agora,
            Agora
        );

        Assert.NotEqual(primeiro, segundo);
    }
}

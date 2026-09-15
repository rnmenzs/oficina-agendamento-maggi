using Oficina.Domain.Entities;
using Oficina.Domain.Exceptions;

namespace Oficina.Tests.Domain.Entities;

public class VeiculoTests
{
    private static readonly DateTimeOffset Agora = new(2026, 9, 15, 12, 0, 0, TimeSpan.FromHours(-3));

    [Fact]
    public void Criar_monta_veiculo_com_os_valores_normalizados()
    {
        var clienteId = Guid.CreateVersion7();

        var veiculo = Veiculo.Criar(clienteId, "  abc-1234 ", "  Fiat Argo  ", 2021);

        Assert.Equal(clienteId, veiculo.ClienteId);
        Assert.Equal("ABC1234", veiculo.Placa.Valor);
        Assert.Equal("Fiat Argo", veiculo.Modelo);
        Assert.Equal(2021, veiculo.Ano);
    }

    [Fact]
    public void Criar_gera_id_proprio_na_versao_7()
    {
        var primeiro = Veiculo.Criar(Guid.CreateVersion7(), "ABC1234", "Fiat Argo", 2021);
        var segundo = Veiculo.Criar(Guid.CreateVersion7(), "DEF5678", "Fiat Argo", 2021);

        Assert.NotEqual(Guid.Empty, primeiro.Id);
        Assert.NotEqual(primeiro.Id, segundo.Id);
        Assert.Equal(7, primeiro.Id.Version);
        Assert.Equal(7, segundo.Id.Version);
    }

    [Fact]
    public void Criar_recusa_cliente_vazio()
    {
        var excecao = Assert.Throws<DomainException>(
            () => Veiculo.Criar(Guid.Empty, "ABC1234", "Fiat Argo", 2021)
        );

        Assert.Contains("Cliente é obrigatório", excecao.Message);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Criar_recusa_modelo_vazio(string? modelo)
    {
        var excecao = Assert.Throws<DomainException>(
            () => Veiculo.Criar(Guid.CreateVersion7(), "ABC1234", modelo, 2021)
        );

        Assert.Contains("Modelo é obrigatório", excecao.Message);
    }

    [Fact]
    public void Criar_recusa_modelo_acima_do_tamanho_da_coluna()
    {
        var modelo = new string('a', 101);

        var excecao = Assert.Throws<DomainException>(
            () => Veiculo.Criar(Guid.CreateVersion7(), "ABC1234", modelo, 2021)
        );

        Assert.Contains("100", excecao.Message);
    }

    [Fact]
    public void Criar_propaga_a_validacao_da_placa()
    {
        var excecao = Assert.Throws<DomainException>(
            () => Veiculo.Criar(Guid.CreateVersion7(), "AB-1234", "Fiat Argo", 2021)
        );

        Assert.Contains("Placa inválida", excecao.Message);
    }

    [Fact]
    public void Criar_aceita_o_ano_seguinte_ao_atual()
    {
        // A indústria vende o modelo do ano que vem, então esse é o teto.
        var anoSeguinte = DateTime.UtcNow.Year + 1;

        var veiculo = Veiculo.Criar(Guid.CreateVersion7(), "ABC1234", "Fiat Argo", anoSeguinte);

        Assert.Equal(anoSeguinte, veiculo.Ano);
    }

    [Fact]
    public void Criar_recusa_ano_acima_do_seguinte_ao_atual()
    {
        var doisAnosAFrente = DateTime.UtcNow.Year + 2;

        var excecao = Assert.Throws<DomainException>(
            () => Veiculo.Criar(Guid.CreateVersion7(), "ABC1234", "Fiat Argo", doisAnosAFrente)
        );

        Assert.Contains("Ano deve estar entre", excecao.Message);
    }

    [Theory]
    [InlineData(1899)]
    [InlineData(0)]
    [InlineData(-2021)]
    public void Criar_recusa_ano_abaixo_do_minimo(int ano)
    {
        var excecao = Assert.Throws<DomainException>(
            () => Veiculo.Criar(Guid.CreateVersion7(), "ABC1234", "Fiat Argo", ano)
        );

        Assert.Contains("1900", excecao.Message);
    }

    [Fact]
    public void Criar_deixa_os_carimbos_nulos_porque_quem_define_e_o_banco()
    {
        var veiculo = Veiculo.Criar(Guid.CreateVersion7(), "ABC1234", "Fiat Argo", 2021);

        Assert.Null(veiculo.CriadoEm);
        Assert.Null(veiculo.AtualizadoEm);
    }

    [Fact]
    public void Reconstituir_preserva_o_id_vindo_do_banco()
    {
        var id = Guid.CreateVersion7();

        var veiculo = Veiculo.Reconstituir(
            id,
            Guid.CreateVersion7(),
            "ABC1234",
            "Fiat Argo",
            2021,
            Agora,
            Agora
        );

        Assert.Equal(id, veiculo.Id);
    }

    [Fact]
    public void Reconstituir_converte_os_carimbos_para_utc()
    {
        var veiculo = Veiculo.Reconstituir(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            "ABC1234",
            "Fiat Argo",
            2021,
            Agora,
            Agora
        );

        Assert.Equal(TimeSpan.Zero, veiculo.CriadoEm!.Value.Offset);
        Assert.Equal(Agora.UtcDateTime, veiculo.CriadoEm.Value.UtcDateTime);
        Assert.Equal(TimeSpan.Zero, veiculo.AtualizadoEm!.Value.Offset);
    }

    [Fact]
    public void Veiculos_com_os_mesmos_dados_recebem_identidades_diferentes()
    {
        var clienteId = Guid.CreateVersion7();

        var primeiro = Veiculo.Criar(clienteId, "ABC1234", "Fiat Argo", 2021);
        var segundo = Veiculo.Criar(clienteId, "ABC1234", "Fiat Argo", 2021);

        Assert.NotEqual(primeiro.Id, segundo.Id);
    }
}

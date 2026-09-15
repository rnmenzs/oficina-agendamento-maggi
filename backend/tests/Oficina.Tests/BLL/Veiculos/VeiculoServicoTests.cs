using Oficina.BLL.Veiculos;
using Oficina.Domain.Entities;
using Oficina.Domain.Exceptions;
using Oficina.Domain.Repositories;
using Oficina.DTO.Veiculos;

namespace Oficina.Tests.BLL.Veiculos;

public class VeiculoServicoTests
{
    private static readonly DateTimeOffset Carimbo = new(2026, 9, 15, 15, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task CriarAsync_devolve_response_com_a_placa_normalizada()
    {
        var (servico, dono, _, _) = Montar();

        var response = await servico.CriarAsync(
            dono.Id,
            new CriarVeiculoRequest("  abc-1234 ", "  Fiat Argo  ", 2021),
            CancellationToken.None
        );

        Assert.Equal(dono.Id, response.ClienteId);
        Assert.Equal("ABC1234", response.Placa);
        Assert.Equal("Fiat Argo", response.Modelo);
        Assert.Equal(2021, response.Ano);
        Assert.Equal(Carimbo, response.CriadoEm);
    }

    [Fact]
    public async Task CriarAsync_recusa_cliente_inexistente_antes_de_tocar_no_repositorio()
    {
        var (servico, _, veiculos, _) = Montar();

        var excecao = await Assert.ThrowsAsync<NaoEncontradoException>(
            () => servico.CriarAsync(
                Guid.CreateVersion7(),
                new CriarVeiculoRequest("ABC1234", "Fiat Argo", 2021),
                CancellationToken.None
            )
        );

        Assert.Contains("Cliente não encontrado", excecao.Message);
        Assert.Empty(veiculos.Veiculos);
    }

    [Fact]
    public async Task CriarAsync_recusa_dado_invalido_sem_gravar()
    {
        var (servico, dono, veiculos, _) = Montar();

        await Assert.ThrowsAsync<DomainException>(
            () => servico.CriarAsync(
                dono.Id,
                new CriarVeiculoRequest("AB-1234", "Fiat Argo", 2021),
                CancellationToken.None
            )
        );

        Assert.Empty(veiculos.Veiculos);
    }

    [Fact]
    public async Task CriarAsync_propaga_o_conflito_de_placa()
    {
        var (servico, dono, _, _) = Montar();
        var request = new CriarVeiculoRequest("ABC1234", "Fiat Argo", 2021);
        await servico.CriarAsync(dono.Id, request, CancellationToken.None);

        var excecao = await Assert.ThrowsAsync<ConflitoException>(
            () => servico.CriarAsync(dono.Id, request, CancellationToken.None)
        );

        Assert.Contains("placa", excecao.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ListarPorClienteAsync_devolve_apenas_os_veiculos_daquele_cliente()
    {
        var (servico, dono, _, clientes) = Montar();
        var outro = Cliente.Reconstituir(
            Guid.CreateVersion7(),
            "Outro Dono",
            "11911112222",
            "outro@email.com",
            Carimbo,
            Carimbo
        );
        clientes.Clientes.Add(outro);

        var doDono = new CriarVeiculoRequest("ABC1234", "Argo", 2021);
        var doOutro = new CriarVeiculoRequest("DEF5678", "Onix", 2020);
        await servico.CriarAsync(dono.Id, doDono, CancellationToken.None);
        await servico.CriarAsync(outro.Id, doOutro, CancellationToken.None);

        var lista = await servico.ListarPorClienteAsync(dono.Id, CancellationToken.None);

        Assert.Single(lista);
        Assert.Equal("ABC1234", lista[0].Placa);
    }

    [Fact]
    public async Task ListarPorClienteAsync_recusa_cliente_inexistente()
    {
        var (servico, _, _, _) = Montar();

        await Assert.ThrowsAsync<NaoEncontradoException>(
            () => servico.ListarPorClienteAsync(Guid.CreateVersion7(), CancellationToken.None)
        );
    }

    [Fact]
    public async Task ListarAsync_devolve_os_veiculos_de_todos_os_clientes()
    {
        var (servico, dono, _, _) = Montar();
        var argo = new CriarVeiculoRequest("ABC1234", "Argo", 2021);
        var onix = new CriarVeiculoRequest("DEF5678", "Onix", 2020);
        await servico.CriarAsync(dono.Id, argo, CancellationToken.None);
        await servico.CriarAsync(dono.Id, onix, CancellationToken.None);

        var todos = await servico.ListarAsync(CancellationToken.None);

        Assert.Equal(2, todos.Count);
    }

    private static (
        VeiculoServico Servico,
        Cliente Dono,
        VeiculoRepositorioFalso Veiculos,
        ClienteRepositorioFalso Clientes
    ) Montar()
    {
        var dono = Cliente.Reconstituir(
            Guid.CreateVersion7(),
            "Dono Teste",
            "11988880001",
            "dono@email.com",
            Carimbo,
            Carimbo
        );

        var clientes = new ClienteRepositorioFalso();
        clientes.Clientes.Add(dono);

        var veiculos = new VeiculoRepositorioFalso();

        return (new VeiculoServico(veiculos, clientes, new RelogioFalso()), dono, veiculos, clientes);
    }

    // Relógio fixo: o teste diz em que instante o cenário acontece, em vez de depender de quando roda.
    private sealed class RelogioFalso : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Carimbo;
    }

    private sealed class VeiculoRepositorioFalso : IVeiculoRepositorio
    {
        public List<Veiculo> Veiculos { get; } = [];

        public Task<Veiculo> AdicionarAsync(Veiculo veiculo, CancellationToken cancellationToken)
        {
            if (Veiculos.Any(v => v.Placa.Valor == veiculo.Placa.Valor))
            {
                throw new ConflitoException("Já existe um veículo com esta placa.");
            }

            var salvo = Veiculo.Reconstituir(
                veiculo.Id,
                veiculo.ClienteId,
                veiculo.Placa.Valor,
                veiculo.Modelo,
                veiculo.Ano,
                Carimbo,
                Carimbo
            );

            Veiculos.Add(salvo);

            return Task.FromResult(salvo);
        }

        public Task<Veiculo?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken)
        {
            return Task.FromResult(Veiculos.SingleOrDefault(v => v.Id == id));
        }

        public Task<IReadOnlyList<Veiculo>> ListarAsync(CancellationToken cancellationToken)
        {
            return Task.FromResult<IReadOnlyList<Veiculo>>(
                Veiculos.OrderBy(v => v.Placa.Valor).ToList()
            );
        }

        public Task<IReadOnlyList<Veiculo>> ListarPorClienteAsync(
            Guid clienteId,
            CancellationToken cancellationToken
        )
        {
            return Task.FromResult<IReadOnlyList<Veiculo>>(
                Veiculos.Where(v => v.ClienteId == clienteId).OrderBy(v => v.Placa.Valor).ToList()
            );
        }
    }

    private sealed class ClienteRepositorioFalso : IClienteRepositorio
    {
        public List<Cliente> Clientes { get; } = [];

        public Task<Cliente> AdicionarAsync(Cliente cliente, CancellationToken cancellationToken)
        {
            Clientes.Add(cliente);

            return Task.FromResult(cliente);
        }

        public Task<Cliente?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken)
        {
            return Task.FromResult(Clientes.SingleOrDefault(c => c.Id == id));
        }

        public Task<IReadOnlyList<Cliente>> ListarAsync(CancellationToken cancellationToken)
        {
            return Task.FromResult<IReadOnlyList<Cliente>>(Clientes);
        }
    }
}

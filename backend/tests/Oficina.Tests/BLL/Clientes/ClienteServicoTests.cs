using Oficina.BLL.Clientes;
using Oficina.Domain.Entities;
using Oficina.Domain.Exceptions;
using Oficina.Domain.Repositories;
using Oficina.DTO.Clientes;

namespace Oficina.Tests.BLL.Clientes;

public class ClienteServicoTests
{
    private static readonly DateTimeOffset Carimbo = new(2026, 9, 14, 15, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task CriarAsync_devolve_response_com_os_valores_normalizados()
    {
        var servico = new ClienteServico(new RepositorioFalso());

        var response = await servico.CriarAsync(
            new CriarClienteRequest("  Ana Souza ", "(11) 98888-0001", "Ana@Email.COM"),
            CancellationToken.None
        );

        Assert.Equal("Ana Souza", response.Nome);
        Assert.Equal("11988880001", response.Telefone);
        Assert.Equal("ana@email.com", response.Email);
        Assert.NotEqual(Guid.Empty, response.Id);
    }

    [Fact]
    public async Task CriarAsync_devolve_os_carimbos_que_vieram_do_repositorio()
    {
        var servico = new ClienteServico(new RepositorioFalso());

        var response = await servico.CriarAsync(
            new CriarClienteRequest("Ana", "11988880001", "ana@email.com"),
            CancellationToken.None
        );

        Assert.Equal(Carimbo, response.CriadoEm);
        Assert.Equal(Carimbo, response.AtualizadoEm);
    }

    [Fact]
    public async Task CriarAsync_recusa_dado_invalido_antes_de_chamar_o_repositorio()
    {
        var repositorio = new RepositorioFalso();
        var servico = new ClienteServico(repositorio);

        await Assert.ThrowsAsync<DomainException>(
            () => servico.CriarAsync(
                new CriarClienteRequest("Ana", "123", "ana@email.com"),
                CancellationToken.None
            )
        );

        Assert.Empty(repositorio.Clientes);
    }

    [Fact]
    public async Task CriarAsync_propaga_o_conflito_de_email_do_repositorio()
    {
        var servico = new ClienteServico(new RepositorioFalso());
        var request = new CriarClienteRequest("Ana", "11988880001", "ana@email.com");
        await servico.CriarAsync(request, CancellationToken.None);

        var excecao = await Assert.ThrowsAsync<ConflitoException>(
            () => servico.CriarAsync(request, CancellationToken.None)
        );

        Assert.Contains("já existe", excecao.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ListarAsync_mapeia_todos_os_clientes()
    {
        var servico = new ClienteServico(new RepositorioFalso());
        await servico.CriarAsync(new CriarClienteRequest("Ana", "11988880001", "ana@email.com"), CancellationToken.None);
        await servico.CriarAsync(new CriarClienteRequest("Bruno", "11977770002", "bruno@email.com"), CancellationToken.None);

        var lista = await servico.ListarAsync(CancellationToken.None);

        Assert.Equal(2, lista.Count);
        Assert.Contains(lista, c => c.Email == "ana@email.com");
        Assert.Contains(lista, c => c.Email == "bruno@email.com");
    }

    [Fact]
    public async Task ObterPorIdAsync_recusa_cliente_inexistente()
    {
        var servico = new ClienteServico(new RepositorioFalso());

        var excecao = await Assert.ThrowsAsync<NaoEncontradoException>(
            () => servico.ObterPorIdAsync(Guid.NewGuid(), CancellationToken.None)
        );

        Assert.Contains("Cliente não encontrado", excecao.Message);
    }

    [Fact]
    public async Task ObterPorIdAsync_devolve_o_cliente_quando_existe()
    {
        var servico = new ClienteServico(new RepositorioFalso());
        var criado = await servico.CriarAsync(
            new CriarClienteRequest("Ana", "11988880001", "ana@email.com"),
            CancellationToken.None
        );

        var response = await servico.ObterPorIdAsync(criado.Id, CancellationToken.None);

        Assert.Equal(criado.Id, response.Id);
        Assert.Equal("Ana", response.Nome);
    }

    // Repositório em memória: testa a orquestração do serviço sem precisar de banco.
    private sealed class RepositorioFalso : IClienteRepositorio
    {
        public List<Cliente> Clientes { get; } = [];

        public Task<Cliente> AdicionarAsync(Cliente cliente, CancellationToken cancellationToken)
        {
            if (Clientes.Any(c => c.Email.Valor == cliente.Email.Valor))
            {
                throw new ConflitoException("Já existe um cliente com este e-mail.");
            }

            // Imita o banco: devolve a entidade já com os carimbos preenchidos.
            var salvo = Cliente.Reconstituir(
                cliente.Id,
                cliente.Nome,
                cliente.Telefone.Valor,
                cliente.Email.Valor,
                Carimbo,
                Carimbo
            );

            Clientes.Add(salvo);

            return Task.FromResult(salvo);
        }

        public Task<Cliente?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken)
        {
            return Task.FromResult(Clientes.SingleOrDefault(c => c.Id == id));
        }

        public Task<IReadOnlyList<Cliente>> ListarAsync(CancellationToken cancellationToken)
        {
            return Task.FromResult<IReadOnlyList<Cliente>>(Clientes.OrderBy(c => c.Nome).ToList());
        }
    }
}

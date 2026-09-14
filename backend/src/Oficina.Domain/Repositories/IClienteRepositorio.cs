using Oficina.Domain.Entities;

namespace Oficina.Domain.Repositories;

public interface IClienteRepositorio
{
    // O cliente que entra tem CriadoEm e AtualizadoEm nulos; o que volta traz os carimbos que o banco gerou.
    // A unicidade do e-mail é do banco: a violação da constraint sobe para a BLL traduzir em conflito.
    Task<Cliente> AdicionarAsync(Cliente cliente, CancellationToken cancellationToken);

    // Não encontrar é resultado possível da consulta, não caso excepcional: por isso não lança.
    Task<Cliente?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken);

    Task<IReadOnlyList<Cliente>> ListarAsync(CancellationToken cancellationToken);
}

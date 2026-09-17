using Oficina.Domain.Entities;

namespace Oficina.Domain.Repositories;

public interface IUsuarioRepositorio
{
    Task<Usuario?> ObterPorLoginAsync(string login, CancellationToken cancellationToken);
}

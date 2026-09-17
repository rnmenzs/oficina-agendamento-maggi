namespace Oficina.Domain.Entities;

public sealed class Usuario
{
    public Guid Id { get; init; }
    public required string Login { get; init; }
    public required string SenhaHash { get; init; }
    public required string Nome { get; init; }
}

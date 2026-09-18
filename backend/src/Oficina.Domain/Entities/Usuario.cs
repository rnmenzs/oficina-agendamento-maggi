namespace Oficina.Domain.Entities;

// Quem entra no sistema. Só nasce do banco: não há cadastro de usuário, o admin vem da migration 004.
public sealed class Usuario
{
    public Guid Id { get; }
    public string Login { get; }
    public string SenhaHash { get; }
    public string Nome { get; }

    private Usuario(Guid id, string login, string senhaHash, string nome)
    {
        Id = id;
        Login = login;
        SenhaHash = senhaHash;
        Nome = nome;
    }

    public static Usuario Reconstituir(Guid id, string login, string senhaHash, string nome)
    {
        return new Usuario(id, login, senhaHash, nome);
    }
}

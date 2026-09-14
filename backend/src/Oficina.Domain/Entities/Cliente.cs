using Oficina.Domain.Exceptions;
using Oficina.Domain.ValueObjects;

namespace Oficina.Domain.Entities;

public sealed class Cliente
{
    // Espelha VARCHAR(150) da coluna nome.
    private const int TamanhoMaximoNome = 150;

    public Guid Id { get; }
    public string Nome { get; }
    public Telefone Telefone { get; }
    public Email Email { get; }
    // Nulos até o cliente ser gravado: quem define os instantes é o banco, por DEFAULT now() e por gatilho.
    public DateTimeOffset? CriadoEm { get; }
    public DateTimeOffset? AtualizadoEm { get; }

    private Cliente(Guid id, string nome, Telefone telefone, Email email, DateTimeOffset? criadoEm, DateTimeOffset? atualizadoEm)
    {
        Id = id;
        Nome = nome;
        Telefone = telefone;
        Email = email;
        CriadoEm = criadoEm;
        AtualizadoEm = atualizadoEm;
    }

    // Cliente novo: o id nasce aqui, não no banco. Guid v7 é ordenado por tempo e não fragmenta o índice.
    public static Cliente Criar(string? nome, string? telefone, string? email) =>
        new(Guid.CreateVersion7(), ValidarNome(nome), Telefone.Criar(telefone), Email.Criar(email), criadoEm: null, atualizadoEm: null);

    // Em UTC porque as colunas são timestamptz e o Npgsql trabalha com offset zero.
    public static Cliente Reconstituir(
        Guid id, string nome, string telefone, string email, DateTimeOffset criadoEm, DateTimeOffset atualizadoEm) =>
        new(id, ValidarNome(nome), Telefone.Criar(telefone), Email.Criar(email),
            criadoEm.ToUniversalTime(), atualizadoEm.ToUniversalTime());

    private static string ValidarNome(string? nome)
    {
        var texto = (nome ?? string.Empty).Trim();

        if (texto.Length == 0)
        {
            throw new DomainException("Nome é obrigatório.");
        }

        if (texto.Length > TamanhoMaximoNome)
        {
            throw new DomainException($"Nome deve ter no máximo {TamanhoMaximoNome} caracteres.");
        }

        return texto;
    }
}

using System.Text.RegularExpressions;
using Oficina.Domain.Exceptions;

namespace Oficina.Domain.ValueObjects;

public sealed record Email
{
    // 254 é o limite prático de um endereço (RFC 5321) e o tamanho da coluna no banco.
    private const int TamanhoMaximo = 254;

    // Guardado em minúsculas: o banco tem CHECK (email = lower(email)) e UNIQUE.
    public string Valor { get; }

    private Email(string valor)
    {
        Valor = valor;
    }

    public static Email Criar(string? entrada)
    {
        var texto = (entrada ?? string.Empty).Trim().ToLowerInvariant();

        if (texto.Length == 0)
        {
            throw new DomainException("Email é obrigatório.");
        }

        if (texto.Length > TamanhoMaximo)
        {
            throw new DomainException($"Email deve ter no máximo {TamanhoMaximo} caracteres.");
        }

        if (!Formato.IsMatch(texto))
        {
            throw new DomainException("Email inválido. Use o formato 'email@dominio.com'.");
        }

        return new Email(texto);
    }

    public override string ToString() => Valor;

    private static readonly Regex Formato = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);
}

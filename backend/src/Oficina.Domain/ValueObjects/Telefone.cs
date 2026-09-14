using System.Text.RegularExpressions;
using Oficina.Domain.Exceptions;

namespace Oficina.Domain.ValueObjects;

public sealed partial record Telefone
{
    // Guardado só com dígitos, DDD incluído, como Placa e Email: máscara é responsabilidade do frontend.
    public string Valor { get; }

    private Telefone(string valor)
    {
        Valor = valor;
    }

    public static Telefone Criar(string? entrada)
    {
        var texto = (entrada ?? string.Empty).Trim();

        if (texto.Length == 0)
        {
            throw new DomainException("Telefone é obrigatório.");
        }

        var digitos = NaoDigitos().Replace(texto, string.Empty);

        if (!Formato().IsMatch(digitos))
        {
            throw new DomainException("Telefone inválido. Informe DDD e número, com 10 ou 11 dígitos.");
        }

        return new Telefone(digitos);
    }

    public override string ToString() => Valor;

    [GeneratedRegex(@"\D")]
    private static partial Regex NaoDigitos();

    // DDD sem zero (11 a 99), depois celular com 9 dígitos iniciado em 9 ou fixo com 8 dígitos.
    [GeneratedRegex("^[1-9][1-9](?:9[0-9]{8}|[2-8][0-9]{7})$")]
    private static partial Regex Formato();
}

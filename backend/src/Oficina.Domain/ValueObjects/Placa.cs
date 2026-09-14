using System.Text.RegularExpressions;
using Oficina.Domain.Exceptions;

namespace Oficina.Domain.ValueObjects;

public sealed record Placa
{
    // Guardada sem hífen e em maiúsculas (ABC1234 ou ABC1D23); o hífen do formato antigo é só exibição.
    public string Valor { get; }

    private Placa(string valor)
    {
        Valor = valor;
    }

    public static Placa Criar(string? entrada)
    {
        var texto = (entrada ?? string.Empty).Trim().ToUpperInvariant();

        if (texto.Length == 0)
        {
            throw new DomainException("Placa é obrigatória.");
        }

        if (FormatoAntigo.IsMatch(texto))
        {
            return new Placa(texto.Replace("-", string.Empty));
        }

        if (FormatoMercosul.IsMatch(texto))
        {
            return new Placa(texto);
        }

        throw new DomainException("Placa inválida. Use o formato antigo (ABC-1234) ou Mercosul (ABC1D23).");
    }

    public string Formatada => char.IsDigit(Valor[4]) ? $"{Valor[..3]}-{Valor[3..]}" : Valor;

    public override string ToString() => Formatada;

    private static readonly Regex FormatoAntigo = new("^[A-Z]{3}-?[0-9]{4}$", RegexOptions.Compiled);
    private static readonly Regex FormatoMercosul = new("^[A-Z]{3}[0-9][A-Z][0-9]{2}$", RegexOptions.Compiled);
}

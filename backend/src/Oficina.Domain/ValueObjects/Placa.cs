using System.Text.RegularExpressions;
using Oficina.Domain.Exceptions;

namespace Oficina.Domain.ValueObjects;

public sealed partial record Placa
{
    // Guardada sem hífen e em maiúsculas (ABC1234 ou ABC1D23), a mesma forma do CHECK no banco.
    // Formatação para exibição é responsabilidade do frontend, por isso não há propriedade formatada aqui.
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

        if (FormatoAntigo().IsMatch(texto))
        {
            return new Placa(texto.Replace("-", string.Empty));
        }

        if (FormatoMercosul().IsMatch(texto))
        {
            return new Placa(texto);
        }

        throw new DomainException("Placa inválida. Use o formato antigo (ABC-1234) ou Mercosul (ABC1D23).");
    }

    public override string ToString() => Valor;

    [GeneratedRegex("^[A-Z]{3}-?[0-9]{4}$")]
    private static partial Regex FormatoAntigo();

    [GeneratedRegex("^[A-Z]{3}[0-9][A-Z][0-9]{2}$")]
    private static partial Regex FormatoMercosul();
}

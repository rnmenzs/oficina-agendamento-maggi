using Oficina.Domain.Exceptions;
using Oficina.Domain.ValueObjects;

namespace Oficina.Domain.Entities;

public sealed class Veiculo
{
    // Espelha VARCHAR(100) da coluna modelo.
    private const int TamanhoMaximoModelo = 100;

    private const int AnoMinimo = 1900;

    // Propriedade, não campo: com "=" o valor congelaria na carga da classe.
    private static int AnoMaximo { get { return DateTime.UtcNow.Year + 1; } }

    public Guid Id { get; }

    // Id, e não a entidade Cliente: agregados se referenciam por identificador.
    public Guid ClienteId { get; }

    public Placa Placa { get; }
    public string Modelo { get; }
    public int Ano { get; }

    // Nulos até o veículo ser gravado: quem define os instantes é o banco, por DEFAULT now() e por gatilho.
    public DateTimeOffset? CriadoEm { get; }
    public DateTimeOffset? AtualizadoEm { get; }

    private Veiculo(
        Guid id,
        Guid clienteId,
        Placa placa,
        string modelo,
        int ano,
        DateTimeOffset? criadoEm,
        DateTimeOffset? atualizadoEm
    )
    {
        Id = id;
        ClienteId = clienteId;
        Placa = placa;
        Modelo = modelo;
        Ano = ano;
        CriadoEm = criadoEm;
        AtualizadoEm = atualizadoEm;
    }

    // Veículo novo: o id nasce aqui, não no banco. Guid v7 é ordenado por tempo e não fragmenta o índice.
    public static Veiculo Criar(Guid clienteId, string? placa, string? modelo, int ano)
    {
        return new Veiculo(
            Guid.CreateVersion7(),
            ValidarClienteId(clienteId),
            Placa.Criar(placa),
            ValidarModelo(modelo),
            ValidarAno(ano),
            criadoEm: null,
            atualizadoEm: null
        );
    }

    // Em UTC porque as colunas são timestamptz e o Npgsql trabalha com offset zero.
    public static Veiculo Reconstituir(
        Guid id,
        Guid clienteId,
        string placa,
        string modelo,
        int ano,
        DateTimeOffset criadoEm,
        DateTimeOffset atualizadoEm
    )
    {
        return new Veiculo(
            id,
            ValidarClienteId(clienteId),
            Placa.Criar(placa),
            ValidarModelo(modelo),
            ValidarAno(ano),
            criadoEm.ToUniversalTime(),
            atualizadoEm.ToUniversalTime()
        );
    }

    private static Guid ValidarClienteId(Guid clienteId)
    {
        if (clienteId == Guid.Empty)
        {
            throw new DomainException("Cliente é obrigatório.");
        }

        return clienteId;
    }

    private static string ValidarModelo(string? modelo)
    {
        var texto = (modelo ?? string.Empty).Trim();

        if (texto.Length == 0)
        {
            throw new DomainException("Modelo é obrigatório.");
        }

        if (texto.Length > TamanhoMaximoModelo)
        {
            throw new DomainException($"Modelo deve ter no máximo {TamanhoMaximoModelo} caracteres.");
        }

        return texto;
    }

    private static int ValidarAno(int ano)
    {
        if (ano < AnoMinimo || ano > AnoMaximo)
        {
            throw new DomainException($"Ano deve estar entre {AnoMinimo} e {AnoMaximo}.");
        }

        return ano;
    }
}

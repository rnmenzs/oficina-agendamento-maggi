namespace Oficina.DTO.Veiculos;

public sealed record VeiculoResponse(
    Guid Id,
    Guid ClienteId,
    string Placa,
    string Modelo,
    int Ano,
    DateTimeOffset CriadoEm,
    DateTimeOffset AtualizadoEm
);

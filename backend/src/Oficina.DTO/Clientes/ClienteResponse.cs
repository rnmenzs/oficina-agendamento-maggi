namespace Oficina.DTO.Clientes;

public sealed record ClienteResponse(
    Guid Id,
    string Nome,
    string Telefone,
    string Email,
    DateTimeOffset CriadoEm,
    DateTimeOffset AtualizadoEm
);

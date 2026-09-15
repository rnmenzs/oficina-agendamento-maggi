namespace Oficina.DTO.Agendamentos;

// Carrega veículo e dono porque uma agenda que mostra só identificador é inútil na tela, e buscar
// esses dados por linha custaria uma chamada por agendamento. ClienteId vem junto para a tela
// poder levar ao cliente com um clique.
public sealed record AgendamentoResponse(
    Guid Id,
    Guid VeiculoId,
    string Placa,
    string Modelo,
    Guid ClienteId,
    string NomeDoCliente,
    DateTimeOffset Inicio,
    DateTimeOffset Fim,
    string TipoServico,
    string Status,
    DateTimeOffset CriadoEm,
    DateTimeOffset AtualizadoEm
);

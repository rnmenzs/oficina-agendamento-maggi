namespace Oficina.DTO.Agendamentos;

// O detalhe também traz o dono, que a listagem não precisa: na tela de um agendamento
// interessa saber para quem ligar.
public sealed record AgendamentoDetalheResponse(
    Guid Id,
    Guid VeiculoId,
    string Placa,
    string Modelo,
    int Ano,
    Guid ClienteId,
    string NomeDoCliente,
    string TelefoneDoCliente,
    string EmailDoCliente,
    DateTimeOffset Inicio,
    DateTimeOffset Fim,
    string TipoServico,
    string Status,
    DateTimeOffset CriadoEm,
    DateTimeOffset AtualizadoEm
);

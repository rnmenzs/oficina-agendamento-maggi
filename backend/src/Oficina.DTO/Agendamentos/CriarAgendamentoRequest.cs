namespace Oficina.DTO.Agendamentos;

// TipoServico como texto, não enum: o projeto DTO não referencia o domínio, e o padrão daqui já é
// primitivo na fronteira, como Placa e Email que também são tipos ricos do outro lado.
public sealed record CriarAgendamentoRequest(
    Guid VeiculoId,
    DateTimeOffset Inicio,
    string? TipoServico
);

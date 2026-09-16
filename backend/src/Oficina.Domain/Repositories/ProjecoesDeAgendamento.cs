using Oficina.Domain.Entities;

namespace Oficina.Domain.Repositories;

// A entidade não carrega placa nem nome de cliente, e não deve carregar: ela referencia o veículo
// por identificador. Mas a tela precisa desses dados, e buscá-los por linha custaria uma chamada
// por agendamento. A saída é a consulta devolver a entidade e os dados de exibição lado a lado.

public sealed record AgendamentoNaAgenda(
    Agendamento Agendamento,
    string Placa,
    string Modelo,
    Guid ClienteId,
    string NomeDoCliente
);

public sealed record AgendamentoDetalhado(
    Agendamento Agendamento,
    string Placa,
    string Modelo,
    int Ano,
    Guid ClienteId,
    string NomeDoCliente,
    string TelefoneDoCliente,
    string EmailDoCliente
);

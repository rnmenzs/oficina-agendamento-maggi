using Oficina.Domain.Enums;

namespace Oficina.Domain.Repositories;

// O total vem junto porque a tela precisa saber quantas páginas existem, e contar no banco
// é diferente de contar os itens trazidos.
public sealed record Pagina<T>(
    IReadOnlyList<T> Itens,
    int Total
);

// O filtro anda junto num tipo só: são quatro recortes opcionais mais a página, e passá-los soltos
// já eram seis argumentos posicionais — trocar dois de lugar compila e devolve a lista errada.
public sealed record FiltroDaAgenda(
    DateTimeOffset? De,
    DateTimeOffset? Ate,
    StatusAgendamento? Status,
    Guid? ClienteId,
    bool MaisRecentesPrimeiro,
    int Pagina,
    int TamanhoDaPagina
);

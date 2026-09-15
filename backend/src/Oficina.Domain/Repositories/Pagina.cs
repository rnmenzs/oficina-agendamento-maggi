namespace Oficina.Domain.Repositories;

// O total vem junto porque a tela precisa saber quantas páginas existem, e contar no banco
// é diferente de contar os itens trazidos.
public sealed record Pagina<T>(
    IReadOnlyList<T> Itens,
    int Total
);

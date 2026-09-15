namespace Oficina.DTO;

// Fora de uma pasta de recurso porque serve a qualquer listagem paginada.
// TotalDePaginas vem calculado para a tela não precisar repetir a conta.
public sealed record PaginaResponse<T>(
    IReadOnlyList<T> Itens,
    int Pagina,
    int TamanhoDaPagina,
    int Total,
    int TotalDePaginas
);

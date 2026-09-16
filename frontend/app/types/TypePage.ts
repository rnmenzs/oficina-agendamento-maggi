export interface PageResponse<T> {
    itens: readonly T[];
    pagina: number;
    tamanhoDaPagina: number;
    total: number;
    totalDePaginas: number;
}

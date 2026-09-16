// O middleware do backend responde erro em RFC 9457. O traceId acompanha o 500 e é o que o
// usuário informa ao pedir ajuda.
export interface ProblemDetails {
    type?: string;
    title?: string;
    status?: number;
    detail?: string;
    instance?: string;
    traceId?: string;
}

/** O que um clientAction devolve para a tela quando a API recusa. Sem campo, é aviso solto. */
export interface SubmitFailure {
    message: string;
    field?: string;
}

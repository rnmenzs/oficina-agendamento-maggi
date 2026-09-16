import type { ProblemDetails } from "~/types/TypeError";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5062/api";

/** O que a API recusou. A mensagem já vem pronta para a tela mostrar. */
export class ApiError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

// O backend responde erro em RFC 9457, e o "detail" é a frase escrita para quem lê. Quando nem
// isso vem, sobra o status — melhor que "Failed to fetch", que não diz nada a ninguém.
async function recusa(resposta: Response): Promise<never> {
    let problema: ProblemDetails | null = null;

    try {
        problema = await resposta.json();
    } catch {
        problema = null;
    }

    throw new ApiError(
        resposta.status,
        problema?.detail ?? problema?.title ?? `A API respondeu ${resposta.status}.`
    );
}

type Opcoes = {
    metodo?: "GET" | "POST" | "PATCH";
    corpo?: unknown;
    busca?: Record<string, string | number | undefined>;
};

export async function pedir<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
    const url = new URL(`${BASE}${caminho}`);

    for (const [chave, valor] of Object.entries(opcoes.busca ?? {})) {
        if (valor !== undefined && valor !== "") url.searchParams.set(chave, String(valor));
    }

    let resposta: Response;

    try {
        resposta = await fetch(url, {
            method: opcoes.metodo ?? "GET",
            headers: opcoes.corpo ? { "Content-Type": "application/json" } : undefined,
            body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined
        });
    } catch {
        // Rede fora, API fora, CORS recusado: nada disso tem status, e a tela precisa de uma frase.
        throw new ApiError(0, "Não foi possível falar com o servidor. Verifique se a API está no ar.");
    }

    if (!resposta.ok) return recusa(resposta);
    if (resposta.status === 204) return undefined as T;

    return resposta.json();
}

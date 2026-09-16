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
async function refuse(response: Response): Promise<never> {
    let problem: ProblemDetails | null = null;

    try {
        problem = await response.json();
    } catch {
        problem = null;
    }

    throw new ApiError(
        response.status,
        problem?.detail ?? problem?.title ?? `A API respondeu ${response.status}.`
    );
}

type Options = {
    method?: "GET" | "POST" | "PATCH";
    body?: unknown;
    query?: Record<string, string | number | undefined>;
};

export async function request<T>(path: string, options: Options = {}): Promise<T> {
    const url = new URL(`${BASE}${path}`);

    for (const [key, value] of Object.entries(options.query ?? {})) {
        if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }

    let response: Response;

    try {
        response = await fetch(url, {
            method: options.method ?? "GET",
            headers: options.body ? { "Content-Type": "application/json" } : undefined,
            body: options.body ? JSON.stringify(options.body) : undefined
        });
    } catch {
        // Rede fora, API fora, CORS recusado: nada disso tem status, e a tela precisa de uma frase.
        throw new ApiError(0, "Não foi possível falar com o servidor. Verifique se a API está no ar.");
    }

    if (!response.ok) return refuse(response);
    if (response.status === 204) return undefined as T;

    return response.json();
}

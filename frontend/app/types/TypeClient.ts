import type { Id, Instant } from "./TypeCommon";

export interface ClientResponse {
    id: Id;
    nome: string;
    telefone: string;
    email: string;
    criadoEm: Instant;
    atualizadoEm: Instant;
}

export interface CreateClientRequest {
    nome: string;
    telefone: string;
    email: string;
}

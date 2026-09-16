import type { Id, Instant } from "./TypeCommon";

export type ClientResponse = {
    id: Id;
    nome: string;
    telefone: string;
    email: string;
    criadoEm: Instant;
    atualizadoEm: Instant;
};

export type CreateClientRequest = {
    nome: string;
    telefone: string;
    email: string;
};

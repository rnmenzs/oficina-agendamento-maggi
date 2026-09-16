import type { ClientResponse, CreateClientRequest } from "~/types/TypeClient";
import type { Id } from "~/types/TypeCommon";
import { request } from "./ServiceHttp";

// A listagem de clientes não é paginada na API: devolve o array inteiro.
export function list(): Promise<ClientResponse[]> {
    return request("/clientes");
}

export function get(id: Id): Promise<ClientResponse> {
    return request(`/clientes/${id}`);
}

export function create(client: CreateClientRequest): Promise<ClientResponse> {
    return request("/clientes", { method: "POST", body: client });
}

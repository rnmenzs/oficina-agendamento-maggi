import type { Id } from "~/types/TypeCommon";
import type { CreateVehicleRequest, VehicleResponse } from "~/types/TypeVehicle";
import { request } from "./ServiceHttp";

// Veículo não existe sozinho: ele é de um cliente, e a API o trata como recurso filho.
export function listOfClient(clientId: Id): Promise<VehicleResponse[]> {
    return request(`/clientes/${clientId}/veiculos`);
}

export function create(clientId: Id, vehicle: CreateVehicleRequest): Promise<VehicleResponse> {
    return request(`/clientes/${clientId}/veiculos`, { method: "POST", body: vehicle });
}

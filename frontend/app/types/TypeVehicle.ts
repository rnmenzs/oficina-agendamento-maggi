import type { Id, Instant } from "./TypeCommon";

export interface VehicleResponse {
    id: Id;
    clienteId: Id;
    placa: string;
    modelo: string;
    ano: number;
    criadoEm: Instant;
    atualizadoEm: Instant;
}

export interface CreateVehicleRequest {
    placa: string;
    modelo: string;
    ano: number;
}

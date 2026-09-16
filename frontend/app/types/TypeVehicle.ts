import type { Id, Instant } from "./TypeCommon";

export type VehicleResponse = {
    id: Id;
    clienteId: Id;
    placa: string;
    modelo: string;
    ano: number;
    criadoEm: Instant;
    atualizadoEm: Instant;
};

export type CreateVehicleRequest = {
    placa: string;
    modelo: string;
    ano: number;
};

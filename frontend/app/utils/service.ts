import type { ServiceType } from "~/types/TypeAppointment";

// O catálogo de serviços é fixo no sistema inteiro
export const SERVICE_LABEL: Record<ServiceType, string> = {
    TrocaOleo: "Troca de óleo",
    Revisao: "Revisão",
    Diagnostico: "Diagnóstico"
};

export const SERVICE_TYPES = Object.keys(SERVICE_LABEL) as readonly ServiceType[];

export const SERVICE_MINUTES: Record<ServiceType, number> = {
    TrocaOleo: 30,
    Revisao: 60,
    Diagnostico: 90
};

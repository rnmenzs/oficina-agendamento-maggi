import type { ServiceType } from "~/types/TypeAppointment";

// O catálogo de serviços é fixo no sistema inteiro
export const SERVICE_LABEL: Record<ServiceType, string> = {
    TrocaOleo: "Troca de óleo",
    Revisao: "Revisão",
    Diagnostico: "Diagnóstico"
};

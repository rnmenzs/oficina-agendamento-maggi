import type { ServiceType } from "~/types/TypeAppointment";

// O catálogo de serviços é fixo no sistema inteiro
export const SERVICE_LABEL: Record<ServiceType, string> = {
    TrocaOleo: "Troca de óleo",
    Revisao: "Revisão",
    Diagnostico: "Diagnóstico"
};

export const SERVICE_TYPES = Object.keys(SERVICE_LABEL) as readonly ServiceType[];

/** O tipo vem da URL, que qualquer um edita: sem conferir, a duração vira `undefined` e a conta NaN. */
export function isServiceType(value: string | null): value is ServiceType {
    return (SERVICE_TYPES as readonly string[]).includes(value ?? "");
}

export const SERVICE_MINUTES: Record<ServiceType, number> = {
    TrocaOleo: 30,
    Revisao: 60,
    Diagnostico: 90
};

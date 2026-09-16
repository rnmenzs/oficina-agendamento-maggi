import type { AppointmentStatus } from "~/types/TypeAppointment";

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
    Agendado: "Agendado",
    EmAndamento: "Em andamento",
    Concluido: "Concluído",
    Cancelado: "Cancelado"
};

export const STATUSES = Object.keys(STATUS_LABEL) as readonly AppointmentStatus[];

/** O status vem da URL, que qualquer um edita: sem conferir, `?status=Inexistente` viraria erro 400. */
export function isStatus(valor: string): valor is AppointmentStatus {
    return (STATUSES as readonly string[]).includes(valor);
}

// Para onde cada status pode ir. Mesma regra do backend, repetida aqui só para a tela saber o
// que oferecer: quem recusa de verdade é a API.
const TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
    Agendado: ["EmAndamento", "Cancelado"],
    EmAndamento: ["Concluido"],
    Concluido: [],
    Cancelado: []
};

export function allowedTransitions(status: AppointmentStatus): readonly AppointmentStatus[] {
    return TRANSITIONS[status];
}

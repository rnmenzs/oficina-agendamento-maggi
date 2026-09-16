import type { AppointmentStatus } from "~/types/TypeAppointment";

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
    Agendado: "Agendado",
    EmAndamento: "Em andamento",
    Concluido: "Concluído",
    Cancelado: "Cancelado"
};

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

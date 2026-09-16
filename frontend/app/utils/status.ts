import type { AppointmentStatus } from "~/types/TypeAppointment";

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
    Agendado: "Agendado",
    EmAndamento: "Em andamento",
    Concluido: "Concluído",
    Cancelado: "Cancelado"
};

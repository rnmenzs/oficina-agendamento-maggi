import type { AppointmentResponse } from "~/types/TypeAppointment";
import { dayOf, formatDayShort, formatTime } from "./date";
import { formatPlate } from "./plate";
import { SERVICE_LABEL } from "./service";

/**
 * O que uma confirmação precisa mostrar para a pessoa reconhecer o agendamento antes de mudar o
 * estado dele: que carro é, de quem é, o que vai ser feito e quando.
 */
export function appointmentSummary(appointment: AppointmentResponse): string {
    const day = formatDayShort(dayOf(appointment.inicio));

    return [
        `${appointment.modelo} · ${formatPlate(appointment.placa)}`,
        appointment.nomeDoCliente,
        `${SERVICE_LABEL[appointment.tipoServico]}, ${day} às ${formatTime(appointment.inicio)}`
    ].join(" · ");
}

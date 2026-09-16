import type { ReactNode } from "react";

import { BadgePlate } from "../common/badge/BadgePlate";
import type { AppointmentResponse } from "~/types/TypeAppointment";
import { dayOf, formatDayWithWeekday, formatTime } from "~/utils/date";
import { SERVICE_LABEL, SERVICE_MINUTES } from "~/utils/service";

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex items-baseline gap-4">
            <dt className="w-18 shrink-0 text-xs font-semibold tracking-wider text-muted uppercase">
                {label}
            </dt>
            <dd className="min-w-0 flex-1 font-medium">{children}</dd>
        </div>
    );
}

/**
 * O agendamento em quatro linhas, para a pessoa reconhecer o que vai mudar antes de confirmar.
 * Mesma ordem das colunas da tabela: quem confirma estava olhando a lista um segundo antes.
 */
export function AppointmentSummary({ appointment }: { appointment: AppointmentResponse }) {
    const day = dayOf(appointment.inicio);

    return (
        <dl className="flex flex-col gap-2 rounded-card border border-line bg-surface-alt px-4 py-3.5 text-sm">
            <Field label="Veículo">
                <span className="mr-2 align-middle"><BadgePlate plate={appointment.placa} /></span>
                {appointment.modelo} {appointment.ano}
            </Field>

            <Field label="Cliente">{appointment.nomeDoCliente}</Field>

            <Field label="Serviço">
                {SERVICE_LABEL[appointment.tipoServico]} · {SERVICE_MINUTES[appointment.tipoServico]} min
            </Field>

            <Field label="Quando">
                {formatDayWithWeekday(day)} · {formatTime(appointment.inicio)} – {formatTime(appointment.fim)}
            </Field>
        </dl>
    );
}

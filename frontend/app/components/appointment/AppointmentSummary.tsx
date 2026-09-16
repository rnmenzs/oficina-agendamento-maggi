import type { ReactNode } from "react";

import { BadgePlate } from "../common/badge/BadgePlate";
import type { AppointmentResponse } from "~/types/TypeAppointment";
import { dayOf, formatDayShort, formatTime } from "~/utils/date";
import { SERVICE_LABEL, SERVICE_MINUTES } from "~/utils/service";

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex items-baseline gap-3">
            <span className="w-20 shrink-0 text-xs font-semibold tracking-wider text-muted uppercase">
                {label}
            </span>
            <span className="min-w-0 flex-1">{children}</span>
        </div>
    );
}

/**
 * O agendamento em quatro linhas, para a pessoa reconhecer o que vai mudar antes de confirmar.
 * As mesmas colunas da tabela, na mesma ordem: quem confirma está olhando a lista há um segundo.
 */
export function AppointmentSummary({ appointment }: { appointment: AppointmentResponse }) {
    return (
        <div className="flex flex-col gap-2 rounded-sm border border-line bg-surface-alt p-3 text-sm">
            <Field label="Veículo">
                <span className="font-semibold">{appointment.modelo}</span>
                <span className="ml-1.5 text-muted">{appointment.ano}</span>
                <span className="ml-2 align-middle"><BadgePlate plate={appointment.placa} /></span>
            </Field>

            <Field label="Cliente">{appointment.nomeDoCliente}</Field>

            <Field label="Serviço">
                {SERVICE_LABEL[appointment.tipoServico]}
                <span className="ml-1.5 text-muted">
                    {SERVICE_MINUTES[appointment.tipoServico]} min
                </span>
            </Field>

            <Field label="Quando">
                <span className="font-mono">
                    {formatDayShort(dayOf(appointment.inicio))}
                    <span className="ml-2">
                        {formatTime(appointment.inicio)} – {formatTime(appointment.fim)}
                    </span>
                </span>
            </Field>
        </div>
    );
}

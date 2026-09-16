import type { AppointmentDetailResponse, AppointmentStatus } from "~/types/TypeAppointment";
import type { Instant } from "~/types/TypeCommon";
import { dayOf, formatDayWithWeekday, formatTime } from "~/utils/date";
import { STATUS_LABEL, STATUS_MEANING } from "~/utils/status";

// O ponto repete o código de cor da tabela: quem já sabe o que é verde não aprende de novo.
const DOT: Record<AppointmentStatus, string> = {
    Agendado: "bg-scheduled",
    EmAndamento: "bg-running",
    Concluido: "bg-done",
    Cancelado: "bg-cancelled"
};

type Step = {
    status: AppointmentStatus;
    at: Instant;
};

// A API guarda quando o registro nasceu e quando mudou pela última vez, não cada passo. Então o
// histórico tem duas etapas: a marcação e o estado de agora — e uma só, quando nada mudou desde.
function stepsOf(appointment: AppointmentDetailResponse): readonly Step[] {
    const first: Step = { status: "Agendado", at: appointment.criadoEm };

    if (appointment.status === "Agendado") return [first];

    return [first, { status: appointment.status, at: appointment.atualizadoEm }];
}

export function AppointmentHistory({ appointment }: { appointment: AppointmentDetailResponse }) {
    const steps = stepsOf(appointment);

    return (
        <section className="border-t border-line px-5 py-4">
            <h2 className="text-xs font-semibold tracking-widest text-muted uppercase">Histórico</h2>

            <ol className="mt-3 flex flex-col">
                {steps.map((step, index) => (
                    <li key={step.status} className={`relative pl-6 ${index === steps.length - 1 ? "" : "pb-5"}`}>
                        <span aria-hidden className={`absolute top-1.5 left-0 size-2 rounded-full ${DOT[step.status]}`} />

                        {index < steps.length - 1 && (
                            <span aria-hidden className="absolute top-4 bottom-0 left-1 w-px bg-line" />
                        )}

                        <div className="flex flex-wrap items-baseline gap-x-3">
                            <span className="font-medium">{STATUS_LABEL[step.status]}</span>
                            <time dateTime={step.at} className="ml-auto text-sm whitespace-nowrap text-muted">
                                {formatDayWithWeekday(dayOf(step.at))} · {formatTime(step.at)}
                            </time>
                        </div>

                        <p className="text-sm text-muted">{STATUS_MEANING[step.status]}</p>
                    </li>
                ))}
            </ol>
        </section>
    );
}

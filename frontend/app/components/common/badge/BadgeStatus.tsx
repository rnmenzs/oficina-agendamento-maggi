import type { AppointmentStatus } from "~/types/TypeAppointment";
import { STATUS_LABEL } from "~/utils/status";

// Tom próprio, nenhum igual ao azul da marca: status é informação, não identidade.
const TONE: Record<AppointmentStatus, string> = {
    Agendado: "text-scheduled bg-scheduled-bg",
    EmAndamento: "text-running bg-running-bg",
    Concluido: "text-done bg-done-bg",
    Cancelado: "text-cancelled bg-cancelled-bg"
};

export function BadgeStatus({ status }: { status: AppointmentStatus }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full align-middle py-1 px-2
                text-xs font-semibold whitespace-nowrap ${TONE[status]}`}
        >
            <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
            {STATUS_LABEL[status]}
        </span>
    );
}

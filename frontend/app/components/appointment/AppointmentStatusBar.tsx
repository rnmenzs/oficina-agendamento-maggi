import { BadgeStatus } from "../common/badge/BadgeStatus";
import { Button } from "../common/button/Button";
import type { AppointmentResponse, AppointmentStatus } from "~/types/TypeAppointment";
import { actionsFor } from "~/hooks/useStatusActions";
import { formatTime } from "~/utils/date";
import { SERVICE_MINUTES } from "~/utils/service";

type AppointmentStatusBarProps = {
    appointment: AppointmentResponse;
    busy?: boolean;
    onAction: (appointment: AppointmentResponse, to: AppointmentStatus) => void;
};

// O que a ficha responde primeiro: quando é, em que estado está e o que dá para fazer agora.
// As mesmas transições da linha da agenda, aqui como botões com o rótulo por extenso.
export function AppointmentStatusBar({ appointment, busy, onAction }: AppointmentStatusBarProps) {
    const actions = actionsFor(appointment.status);

    return (
        <div className="flex flex-wrap items-center gap-3.5 border-b border-line px-5 py-4">
            <span className="font-mono text-lg font-semibold">
                {formatTime(appointment.inicio)} – {formatTime(appointment.fim)}
            </span>

            <span className="text-sm text-muted">
                {SERVICE_MINUTES[appointment.tipoServico]} min
            </span>

            <BadgeStatus status={appointment.status} />

            <div className="ml-auto flex flex-wrap gap-2">
                {actions.length === 0
                    ? <span className="text-sm text-muted">Este agendamento está encerrado.</span>
                    : actions.map(action => (
                        <Button
                            key={action.to}
                            variant={action.to === "Cancelado" ? "danger" : "primary"}
                            disabled={busy}
                            onClick={() => onAction(appointment, action.to)}
                        >
                            {action.label}
                        </Button>
                    ))}
            </div>
        </div>
    );
}

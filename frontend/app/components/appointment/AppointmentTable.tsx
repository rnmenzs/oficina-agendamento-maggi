import { ChevronRight } from "lucide-react";

import { BadgePlate } from "../common/badge/BadgePlate";
import { BadgeStatus } from "../common/badge/BadgeStatus";
import { ButtonIcon } from "../common/button/ButtonIcon";
import { Table, type TableColumn } from "../common/table/Table";
import { TableCell } from "../common/table/TableCell";
import { TableRow } from "../common/table/TableRow";
import { Tooltip } from "../common/tooltip/Tooltip";
import type { AppointmentResponse, AppointmentStatus } from "~/types/TypeAppointment";
import { dayOf, formatDayShort, formatTime } from "~/utils/date";
import { SERVICE_LABEL, SERVICE_MINUTES } from "~/utils/service";
import { actionsFor, type StatusAction } from "~/hooks/useStatusActions";

// Sem largura fixa: quem decide é o conteúdo. Fixar as colunas espremia o nome do cliente em
// duas linhas enquanto sobrava espaço na placa.
const COLUMNS: readonly TableColumn[] = [
    { key: "data", label: "Data" },
    { key: "horario", label: "Horário" },
    { key: "placa", label: "Placa" },
    { key: "veiculo", label: "Veículo" },
    { key: "cliente", label: "Cliente" },
    { key: "servico", label: "Serviço" },
    { key: "status", label: "Status" },
    // 1% encolhe a coluna até os ícones e devolve o resto do espaço às outras.
    { key: "acoes", label: "Ações", hidden: true, right: true, width: "1%" }
];

type AppointmentActionsProps = {
    appointment: AppointmentResponse;
    linkTo: string;
    busy?: boolean;
    onAction?: (appointment: AppointmentResponse, to: AppointmentStatus) => void;
};

// O lugar vago continua ocupando espaço: descendo a coluna, o mesmo ponto é sempre a mesma ação,
// e a seta não anda de uma linha para a outra.
// Iniciar e concluir nunca aparecem juntos, então dividem a mesma posição na linha.
function AppointmentActions({ appointment, linkTo, busy, onAction }: AppointmentActionsProps) {
    const allowed = actionsFor(appointment.status);
    const cancel = allowed.find(action => action.to === "Cancelado");
    const advance = allowed.find(action => action.to !== "Cancelado");

    function button(action: StatusAction | undefined) {
        if (!action) return <span aria-hidden className="size-8" />;

        return (
            <Tooltip text={action.label}>
                <ButtonIcon
                    label={`${action.label} de ${appointment.placa}`}
                    icon={action.icon}
                    tone={action.tone}
                    disabled={busy}
                    onClick={() => onAction?.(appointment, action.to)}
                />
            </Tooltip>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 align-middle">
            {button(cancel)}
            {button(advance)}

            <span
                aria-hidden
                className={`mx-0.5 h-4.5 w-px ${allowed.length ? "bg-line" : ""}`}
            />

            <Tooltip text="Abrir agendamento">
                <ButtonIcon
                    to={linkTo}
                    label={`Abrir agendamento de ${appointment.nomeDoCliente}`}
                    icon={ChevronRight}
                />
            </Tooltip>
        </span>
    );
}

type AppointmentTableProps = {
    appointments: readonly AppointmentResponse[];
    /** Enquanto uma troca de status está em curso, as ações da lista inteira esperam. */
    busy?: boolean;
    /** Para onde a seta de cada linha leva. Quem conhece as rotas do sistema é a tela. */
    linkTo: (appointment: AppointmentResponse) => string;
    onAction?: (appointment: AppointmentResponse, to: AppointmentStatus) => void;
};

export function AppointmentTable({ appointments, linkTo, busy, onAction }: AppointmentTableProps) {
    return (
        <Table columns={COLUMNS}>
            {appointments.map(appointment => (
                <TableRow key={appointment.id}>
                    <TableCell>
                        <span className="font-mono text-xs whitespace-nowrap text-muted">
                            {formatDayShort(dayOf(appointment.inicio))}
                        </span>
                    </TableCell>

                    <TableCell>
                        <div className="flex flex-col leading-tight">
                            <span className="font-mono whitespace-nowrap">
                                {formatTime(appointment.inicio)} – {formatTime(appointment.fim)}
                            </span>
                            <span className="font-mono text-xs text-muted">
                                {SERVICE_MINUTES[appointment.tipoServico]} min
                            </span>
                        </div>
                    </TableCell>

                    <TableCell><BadgePlate plate={appointment.placa} /></TableCell>

                    <TableCell>
                        <span className="font-semibold whitespace-nowrap">{appointment.modelo}</span>
                        <span className="ml-1.5 text-muted">{appointment.ano}</span>
                    </TableCell>

                    <TableCell>
                        <span className="whitespace-nowrap">{appointment.nomeDoCliente}</span>
                    </TableCell>

                    <TableCell>
                        <span className="whitespace-nowrap">
                            {SERVICE_LABEL[appointment.tipoServico]}
                        </span>
                    </TableCell>
                    <TableCell><BadgeStatus status={appointment.status} /></TableCell>

                    <TableCell right>
                        <AppointmentActions
                            appointment={appointment}
                            linkTo={linkTo(appointment)}
                            busy={busy}
                            onAction={onAction}
                        />
                    </TableCell>
                </TableRow>
            ))}
        </Table>
    );
}

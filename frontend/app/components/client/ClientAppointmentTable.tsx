import { ChevronRight } from "lucide-react";

import { BadgePlate } from "../common/badge/BadgePlate";
import { BadgeStatus } from "../common/badge/BadgeStatus";
import { ButtonIcon } from "../common/button/ButtonIcon";
import { SkeletonRows } from "../common/skeleton/SkeletonRows";
import { Table, type TableColumn } from "../common/table/Table";
import { TableCell } from "../common/table/TableCell";
import { TableRow } from "../common/table/TableRow";
import { Tooltip } from "../common/tooltip/Tooltip";
import type { AppointmentResponse } from "~/types/TypeAppointment";
import { dayOf, formatDay, formatTime } from "~/utils/date";
import { SERVICE_LABEL } from "~/utils/service";

// Sem as colunas de cliente e de veículo que a agenda tem: numa ficha, o dono é o título da
// página, e o que distingue uma linha da outra é a placa.
const COLUMNS: readonly TableColumn[] = [
    { key: "data", label: "Data" },
    { key: "horario", label: "Horário" },
    { key: "placa", label: "Placa" },
    { key: "servico", label: "Serviço" },
    { key: "status", label: "Status" },
    { key: "acoes", label: "Ações", hidden: true, right: true, width: "1%" }
];

type ClientAppointmentTableProps = {
    appointments: readonly AppointmentResponse[];
    /** As linhas ainda não chegaram: o cabeçalho fica e o corpo vira esqueleto. */
    loading?: boolean;
    /** Para onde a linha leva. Quem conhece as rotas do sistema é a tela. */
    linkTo: (appointment: AppointmentResponse) => string;
    onOpen?: (appointment: AppointmentResponse) => void;
};

export function ClientAppointmentTable({
    appointments, loading = false, linkTo, onOpen
}: ClientAppointmentTableProps) {
    return (
        <Table columns={COLUMNS} busy={loading}>
            {loading ? <SkeletonRows columns={COLUMNS.length} /> : appointments.map(appointment => {
                const day = dayOf(appointment.inicio);

                return (
                    <TableRow key={appointment.id} onOpen={onOpen && (() => onOpen(appointment))}>
                        <TableCell>
                            <span className="font-mono whitespace-nowrap">{formatDay(day)}</span>
                        </TableCell>

                        <TableCell>
                            <span className="font-mono whitespace-nowrap">
                                {formatTime(appointment.inicio)} – {formatTime(appointment.fim)}
                            </span>
                        </TableCell>

                        <TableCell><BadgePlate plate={appointment.placa} /></TableCell>

                        <TableCell>
                            <span className="whitespace-nowrap">
                                {SERVICE_LABEL[appointment.tipoServico]}
                            </span>
                        </TableCell>

                        <TableCell><BadgeStatus status={appointment.status} /></TableCell>

                        <TableCell right>
                            <Tooltip text="Abrir agendamento">
                                <ButtonIcon
                                    to={linkTo(appointment)}
                                    label={`Abrir agendamento de ${formatDay(day)}`}
                                    icon={ChevronRight}
                                />
                            </Tooltip>
                        </TableCell>
                    </TableRow>
                );
            })}
        </Table>
    );
}

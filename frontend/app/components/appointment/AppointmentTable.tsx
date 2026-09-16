import { Check, ChevronRight, Play, X, type LucideIcon } from "lucide-react";

import { BadgePlate } from "../common/badge/BadgePlate";
import { BadgeStatus } from "../common/badge/BadgeStatus";
import { ButtonIcon, type IconTone } from "../common/button/ButtonIcon";
import { Table, type TableColumn } from "../common/table/Table";
import { TableCell } from "../common/table/TableCell";
import { TableRow } from "../common/table/TableRow";
import { Tooltip } from "../common/tooltip/Tooltip";
import type { AppointmentResponse, AppointmentStatus } from "~/types/TypeAppointment";
import { dayOf, formatDayShort, formatTime } from "~/utils/date";
import { SERVICE_LABEL, SERVICE_MINUTES } from "~/utils/service";
import { allowedTransitions } from "~/utils/status";

type Action = {
    label: string;
    icon: LucideIcon;
    tone: IconTone;
};

// Iniciar e concluir nunca aparecem juntos, então dividem a mesma posição na linha.
const AVANCAR: Partial<Record<AppointmentStatus, Action>> = {
    EmAndamento: { label: "Iniciar serviço", icon: Play, tone: "primary" },
    Concluido: { label: "Concluir serviço", icon: Check, tone: "done" }
};

const CANCELAR: Action = { label: "Cancelar agendamento", icon: X, tone: "danger" };

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
    agendamento: AppointmentResponse;
    linkTo: string;
    onAction?: (agendamento: AppointmentResponse, destino: AppointmentStatus) => void;
};

// O lugar vago continua ocupando espaço: descendo a coluna, o mesmo ponto é sempre a mesma ação,
// e a seta não anda de uma linha para a outra.
function AppointmentActions({ agendamento, linkTo, onAction }: AppointmentActionsProps) {
    const permitidas = allowedTransitions(agendamento.status);
    const avancar = permitidas.find(destino => AVANCAR[destino]);

    function botao(destino: AppointmentStatus | undefined, acao: Action | undefined) {
        if (!destino || !acao) return <span aria-hidden className="size-8" />;

        const nome = `${acao.label} de ${agendamento.placa}`;

        return (
            <Tooltip text={acao.label}>
                <ButtonIcon
                    label={nome}
                    icon={acao.icon}
                    tone={acao.tone}
                    onClick={() => onAction?.(agendamento, destino)}
                />
            </Tooltip>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 align-middle">
            {botao("Cancelado", permitidas.includes("Cancelado") ? CANCELAR : undefined)}
            {botao(avancar, avancar && AVANCAR[avancar])}

            <span
                aria-hidden
                className={`mx-0.5 h-4.5 w-px ${permitidas.length ? "bg-line" : ""}`}
            />

            <Tooltip text="Abrir agendamento">
                <ButtonIcon
                    to={linkTo}
                    label={`Abrir agendamento de ${agendamento.nomeDoCliente}`}
                    icon={ChevronRight}
                />
            </Tooltip>
        </span>
    );
}

type AppointmentTableProps = {
    agendamentos: readonly AppointmentResponse[];
    /** Para onde a seta de cada linha leva. Quem conhece as rotas do sistema é a tela. */
    linkTo: (agendamento: AppointmentResponse) => string;
    onAction?: (agendamento: AppointmentResponse, destino: AppointmentStatus) => void;
};

export function AppointmentTable({ agendamentos, linkTo, onAction }: AppointmentTableProps) {
    return (
        <Table columns={COLUMNS}>
            {agendamentos.map(agendamento => (
                <TableRow key={agendamento.id}>
                    <TableCell>
                        <span className="font-mono text-xs whitespace-nowrap text-muted">
                            {formatDayShort(dayOf(agendamento.inicio))}
                        </span>
                    </TableCell>

                    <TableCell>
                        <div className="flex flex-col leading-tight">
                            <span className="font-mono whitespace-nowrap">
                                {formatTime(agendamento.inicio)} – {formatTime(agendamento.fim)}
                            </span>
                            <span className="font-mono text-xs text-muted">
                                {SERVICE_MINUTES[agendamento.tipoServico]} min
                            </span>
                        </div>
                    </TableCell>

                    <TableCell><BadgePlate plate={agendamento.placa} /></TableCell>

                    <TableCell>
                        <span className="font-semibold whitespace-nowrap">{agendamento.modelo}</span>
                        <span className="ml-1.5 text-muted">{agendamento.ano}</span>
                    </TableCell>

                    <TableCell>
                        <span className="whitespace-nowrap">{agendamento.nomeDoCliente}</span>
                    </TableCell>

                    <TableCell>
                        <span className="whitespace-nowrap">
                            {SERVICE_LABEL[agendamento.tipoServico]}
                        </span>
                    </TableCell>
                    <TableCell><BadgeStatus status={agendamento.status} /></TableCell>

                    <TableCell right>
                        <AppointmentActions
                            agendamento={agendamento}
                            linkTo={linkTo(agendamento)}
                            onAction={onAction}
                        />
                    </TableCell>
                </TableRow>
            ))}
        </Table>
    );
}

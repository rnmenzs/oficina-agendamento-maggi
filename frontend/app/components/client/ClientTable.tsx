import { ChevronRight } from "lucide-react";

import { ButtonIcon } from "../common/button/ButtonIcon";
import { Table, type TableColumn } from "../common/table/Table";
import { TableCell } from "../common/table/TableCell";
import { TableRow } from "../common/table/TableRow";
import { Tooltip } from "../common/tooltip/Tooltip";
import type { ClientResponse } from "~/types/TypeClient";
import { dayOf, formatDay } from "~/utils/date";
import { formatPhone } from "~/utils/phone";

const COLUMNS: readonly TableColumn[] = [
    { key: "nome", label: "Nome" },
    { key: "telefone", label: "Telefone" },
    { key: "email", label: "E-mail" },
    { key: "veiculos", label: "Veículos" },
    { key: "desde", label: "Cliente desde" },
    { key: "acoes", label: "Ações", hidden: true, right: true, width: "1%" }
];

type ClientTableProps = {
    clients: readonly ClientResponse[];
    /** Quantos veículos cada cliente tem. A listagem da API não traz, então quem conta é a tela. */
    vehicleCount: (client: ClientResponse) => number;
    /** Para onde a linha leva. Quem conhece as rotas do sistema é a tela. */
    linkTo: (client: ClientResponse) => string;
    onOpen?: (client: ClientResponse) => void;
};

export function ClientTable({ clients, vehicleCount, linkTo, onOpen }: ClientTableProps) {
    return (
        <Table columns={COLUMNS}>
            {clients.map(client => (
                <TableRow key={client.id} onOpen={onOpen && (() => onOpen(client))}>
                    <TableCell>
                        <span className="font-semibold whitespace-nowrap">{client.nome}</span>
                    </TableCell>

                    <TableCell>
                        <span className="font-mono whitespace-nowrap">{formatPhone(client.telefone)}</span>
                    </TableCell>

                    <TableCell>{client.email}</TableCell>

                    <TableCell>
                        <span className="font-mono">{vehicleCount(client)}</span>
                    </TableCell>

                    <TableCell>
                        <span className="font-mono whitespace-nowrap text-muted">
                            {formatDay(dayOf(client.criadoEm))}
                        </span>
                    </TableCell>

                    <TableCell right>
                        <Tooltip text="Abrir cliente">
                            <ButtonIcon
                                to={linkTo(client)}
                                label={`Abrir ${client.nome}`}
                                icon={ChevronRight}
                            />
                        </Tooltip>
                    </TableCell>
                </TableRow>
            ))}
        </Table>
    );
}

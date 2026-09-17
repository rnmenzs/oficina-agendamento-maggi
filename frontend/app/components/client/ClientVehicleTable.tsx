import { BadgePlate } from "../common/badge/BadgePlate";
import { Table, type TableColumn } from "../common/table/Table";
import { TableCell } from "../common/table/TableCell";
import { TableRow } from "../common/table/TableRow";
import type { VehicleResponse } from "~/types/TypeVehicle";
import { dayOf, formatDay } from "~/utils/date";

const COLUMNS: readonly TableColumn[] = [
    { key: "placa", label: "Placa" },
    { key: "modelo", label: "Modelo" },
    { key: "ano", label: "Ano" },
    { key: "cadastro", label: "Cadastrado em" }
];

export function ClientVehicleTable({ vehicles }: { vehicles: readonly VehicleResponse[] }) {
    return (
        <Table columns={COLUMNS}>
            {vehicles.map(vehicle => (
                <TableRow key={vehicle.id}>
                    <TableCell><BadgePlate plate={vehicle.placa} /></TableCell>

                    <TableCell>
                        <span className="font-semibold whitespace-nowrap">{vehicle.modelo}</span>
                    </TableCell>

                    <TableCell>
                        <span className="font-mono">{vehicle.ano}</span>
                    </TableCell>

                    <TableCell>
                        <span className="font-mono whitespace-nowrap text-muted">
                            {formatDay(dayOf(vehicle.criadoEm))}
                        </span>
                    </TableCell>
                </TableRow>
            ))}
        </Table>
    );
}

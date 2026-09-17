import { BadgePlate } from "../common/badge/BadgePlate";
import { SkeletonRows } from "../common/skeleton/SkeletonRows";
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

type ClientVehicleTableProps = {
    vehicles: readonly VehicleResponse[];
    /** As linhas ainda não chegaram: o cabeçalho fica e o corpo vira esqueleto. */
    loading?: boolean;
};

export function ClientVehicleTable({ vehicles, loading = false }: ClientVehicleTableProps) {
    return (
        <Table columns={COLUMNS} busy={loading}>
            {loading ? <SkeletonRows columns={COLUMNS.length} rows={2} /> : vehicles.map(vehicle => (
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

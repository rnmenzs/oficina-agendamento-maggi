import { TableCell } from "../table/TableCell";
import { TableRow } from "../table/TableRow";
import { Skeleton } from "./Skeleton";

// Curta e média se alternam num padrão fixo, e não ao acaso: ao acaso, cada repintura mudaria o
// desenho. Três linhas bastam para dizer "tabela vindo aí" sem fingir saber quantas serão.
const WIDTHS = ["w-[40%]", "w-[70%]", "w-[40%]", "w-[70%]", "w-[70%]", "w-[40%]", "w-[40%]"];

type SkeletonRowsProps = {
    columns: number;
    rows?: number;
};

/** O corpo de uma tabela enquanto os dados não chegam. Vai dentro do `Table`, no lugar das linhas. */
export function SkeletonRows({ columns, rows = 3 }: SkeletonRowsProps) {
    return Array.from({ length: rows }, (_, row) => (
        <TableRow key={row}>
            {Array.from({ length: columns }, (_, column) => (
                <TableCell key={column}>
                    <Skeleton className={`h-3 ${WIDTHS[column % WIDTHS.length]}`} />
                </TableCell>
            ))}
        </TableRow>
    ));
}

import { Skeleton } from "./Skeleton";

type SkeletonTableProps = {
    columns: number;
    rows?: number;
};

// A única forma que se repete: as duas listagens do sistema são tabela. O resto cada tela monta
// com o Skeleton, no formato do que ela carrega.
export function SkeletonTable({ columns, rows = 5 }: SkeletonTableProps) {
    return (
        <Skeleton label="Carregando" className="flex w-full flex-col gap-3 p-4">
            {Array.from({ length: rows }, (_, row) => (
                <div
                    key={row}
                    style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                    className="grid gap-4"
                >
                    {Array.from({ length: columns }, (_, column) => <Skeleton key={column} />)}
                </div>
            ))}
        </Skeleton>
    );
}

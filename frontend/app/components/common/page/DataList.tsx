import type { ReactNode } from "react";

export type DataEntry = {
    label: string;
    value: ReactNode;
};

/**
 * Os dados de um registro em células de mesmo peso, divididas por um fio que elas compartilham.
 * As células crescem para preencher a fileira em vez de deixar buraco no fim: com grade de
 * colunas fixas, cinco campos em três colunas terminam com uma célula vazia e emoldurada.
 */
export function DataList({ entries }: { entries: readonly DataEntry[] }) {
    return (
        <dl className="flex flex-wrap">
            {entries.map(entry => (
                <div
                    key={entry.label}
                    className="cell-line flex grow basis-48 flex-col gap-1 bg-surface px-4 py-3.5"
                >
                    <dt className="text-xs font-semibold tracking-wider text-muted uppercase">
                        {entry.label}
                    </dt>
                    <dd className="font-medium">{entry.value}</dd>
                </div>
            ))}
        </dl>
    );
}

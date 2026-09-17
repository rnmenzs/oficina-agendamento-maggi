import type { ReactNode } from "react";

export type TableColumn = {
    key: string;
    label: string;
    hidden?: boolean;
    right?: boolean;
    width?: string;
};

type TableProps = {
    columns: readonly TableColumn[];
    /** As linhas são esqueleto: o cabeçalho fica, e o leitor de tela sabe que o corpo vai mudar. */
    busy?: boolean;
    children: ReactNode;
};

export function Table({ columns, busy = false, children }: TableProps) {
    return (
        <div aria-busy={busy || undefined} className="overflow-x-auto rounded-t-card">
            {busy && <span role="status" className="sr-only">Carregando</span>}

            <table className="w-full border-collapse text-sm">
                <colgroup>
                    {columns.map(column => <col key={column.key} style={{ width: column.width }} />)}
                </colgroup>

                <thead>
                    <tr>
                        {columns.map(({ key, label, hidden, right }) => (
                            <th
                                key={key}
                                scope="col"
                                className={`border-b border-line bg-surface-alt px-4 py-2 text-xs
                                    font-semibold tracking-widest text-muted uppercase whitespace-nowrap
                                    ${right ? "text-right" : "text-left"}`}
                            >
                                {hidden ? <span className="sr-only">{label}</span> : label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>{children}</tbody>
            </table>
        </div>
    );
}

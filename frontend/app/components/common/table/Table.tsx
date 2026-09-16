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
    children: ReactNode;
};

export function Table({ columns, children }: TableProps) {
    return (
        <div className="overflow-x-auto rounded-t-card">
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

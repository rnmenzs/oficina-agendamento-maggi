import type { ReactNode } from "react";

type TableCellProps = {
    right?: boolean;
    strong?: boolean;
    children: ReactNode;
};

export function TableCell({ right = false, strong = false, children }: TableCellProps) {
    return (
        <td className={`px-4 py-3 align-middle ${right ? "text-right" : ""} ${strong ? "font-semibold" : ""}`}>
            {children}
        </td>
    );
}

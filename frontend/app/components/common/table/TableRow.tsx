import type { ReactNode } from "react";

export function TableRow({ children }: { children: ReactNode }) {
    return (
        <tr className="border-b border-line last:border-0 even:bg-surface-alt hover:bg-primary-soft">
            {children}
        </tr>
    );
}

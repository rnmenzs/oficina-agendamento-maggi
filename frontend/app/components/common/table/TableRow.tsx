import type { MouseEvent, ReactNode } from "react";

type TableRowProps = {
    /** Abrir o registro clicando na linha inteira, e não só na seta. */
    onOpen?: () => void;
    children: ReactNode;
};

export function TableRow({ onOpen, children }: TableRowProps) {
    // O clique que nasce num link ou botão da linha é dele, não da linha: sem esta guarda, a seta
    // dispararia a navegação duas vezes.
    function onClick(event: MouseEvent<HTMLTableRowElement>) {
        if ((event.target as HTMLElement).closest("a, button")) return;

        onOpen?.();
    }

    return (
        <tr
            onClick={onOpen && onClick}
            className={`border-b border-line last:border-0 even:bg-surface-alt hover:bg-primary-soft
                ${onOpen ? "cursor-pointer" : ""}`}
        >
            {children}
        </tr>
    );
}

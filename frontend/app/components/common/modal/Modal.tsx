import type { ReactNode } from "react";

import { ModalControlProvider, useDialog } from "./Modal.hook";

const WIDTH = {
    narrow: "sm:max-w-100",
    medium: "sm:max-w-120",
    wide: "sm:max-w-155"
};

const BASE = `
    m-auto w-full rounded-card border-0 bg-surface p-0 text-ink shadow-2xl focus:outline-none
    opacity-0 transition-all transition-discrete duration-200 not-open:pointer-events-none
    open:opacity-100 starting:open:opacity-0
    backdrop:bg-ink/0 backdrop:transition-all backdrop:transition-discrete backdrop:duration-200
    open:backdrop:bg-ink/45 starting:open:backdrop:bg-ink/0
    motion-reduce:transition-none motion-reduce:backdrop:transition-none
`;

type ModalProps = {
    open: boolean;
    width?: keyof typeof WIDTH;
    /** Só para janela sem ModalHeader: sem ele ninguém nomeia o que abriu. */
    label?: string;
    onClose: () => void;
    children: ReactNode;
};

export function Modal({ open, width = "medium", label, onClose, children }: ModalProps) {
    const modal = useDialog({ open, onClose });

    return (
        <dialog
            ref={modal.box}
            aria-label={label}
            aria-labelledby={label ? undefined : modal.titleId}
            tabIndex={-1}
            onCancel={modal.onCancel}
            onClick={modal.onClick}
            className={`${BASE} ${WIDTH[width]}`}
        >
            <ModalControlProvider value={{ titleId: modal.titleId, onClose }}>
                {children}
            </ModalControlProvider>
        </dialog>
    );
}

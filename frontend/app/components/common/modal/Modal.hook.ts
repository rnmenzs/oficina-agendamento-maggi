import {
    createContext, useContext, useEffect, useId, useRef, type MouseEvent, type SyntheticEvent
} from "react";

const FOCUSABLE = "input:not([type=hidden]), textarea, select, button, [tabindex]:not([tabindex='-1'])";

type ModalControl = {
    titleId: string;
    onClose: () => void;
};

// As peças da janela precisam do mesmo fechar e do mesmo id de título. Sem isto, quem monta
// passaria a função duas vezes e escreveria o título duas vezes.
const ModalContext = createContext<ModalControl | null>(null);

export const ModalProvider = ModalContext.Provider;

export function useModalControl(): ModalControl {
    const control = useContext(ModalContext);

    if (!control) throw new Error("As peças da janela só funcionam dentro de um Modal.");

    return control;
}

type UseModal = {
    open: boolean;
    onClose: () => void;
};

export function useModal({ open, onClose }: UseModal) {
    const box = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const aberta = useRef(open);
    const fechar = useRef(onClose);

    aberta.current = open;
    fechar.current = onClose;

    useEffect(() => {
        const dialog = box.current;
        if (!dialog) return;

        if (!open) {
            if (dialog.open) dialog.close();
            return;
        }

        if (!dialog.open) dialog.showModal();

        const alvo = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)]
            .find(elemento => !elemento.closest("header"));

        (alvo ?? dialog).focus();
    }, [open]);

    useEffect(() => {
        const dialog = box.current;
        if (!dialog) return;

        function avisar() {
            if (aberta.current) fechar.current();
        }

        dialog.addEventListener("close", avisar);

        return () => dialog.removeEventListener("close", avisar);
    }, []);

    return {
        box,
        titleId,

        onCancel(event: SyntheticEvent) {
            event.preventDefault();
            onClose();
        },

        onClick(event: MouseEvent<HTMLDialogElement>) {
            if (event.target === box.current) onClose();
        }
    };
}

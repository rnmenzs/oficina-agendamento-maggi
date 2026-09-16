import {
    createContext, useContext, useEffect, useId, useRef, type MouseEvent, type SyntheticEvent
} from "react";

// Desabilitado não recebe foco: se ele entrasse na lista, o `focus()` não faria nada e o foco
// cairia no <body>, fora da janela.
const FOCUSABLE = `
    input:not([type=hidden]):not(:disabled), textarea:not(:disabled), select:not(:disabled),
    button:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])
`;

type ModalControl = {
    titleId: string;
    onClose: () => void;
};

// As peças da janela precisam do mesmo fechar e do mesmo id de título. Sem isto, quem monta
// passaria a função duas vezes e escreveria o título duas vezes.
const ModalControlContext = createContext<ModalControl | null>(null);

export const ModalControlProvider = ModalControlContext.Provider;

export function useModalControl(): ModalControl {
    const control = useContext(ModalControlContext);

    if (!control) throw new Error("As peças da janela só funcionam dentro de um Modal.");

    return control;
}

type UseDialog = {
    open: boolean;
    onClose: () => void;
};

export function useDialog({ open, onClose }: UseDialog) {
    const box = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const isOpen = useRef(open);
    const close = useRef(onClose);

    // Em efeito, não no corpo: escrever em ref durante o render é impuro, e um render descartado
    // pela renderização concorrente deixaria o ref com valor que nunca foi confirmado.
    useEffect(() => {
        isOpen.current = open;
        close.current = onClose;
    });

    useEffect(() => {
        const dialog = box.current;
        if (!dialog) return;

        if (!open) {
            if (dialog.open) dialog.close();
            return;
        }

        if (!dialog.open) dialog.showModal();

        const target = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)]
            .find(element => !element.closest("header"));

        (target ?? dialog).focus();
    }, [open]);

    useEffect(() => {
        const dialog = box.current;
        if (!dialog) return;

        function onDialogClose() {
            if (isOpen.current) close.current();
        }

        dialog.addEventListener("close", onDialogClose);

        return () => dialog.removeEventListener("close", onDialogClose);
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

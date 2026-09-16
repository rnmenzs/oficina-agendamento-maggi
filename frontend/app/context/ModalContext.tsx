import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import { Modal } from "~/components/common/modal/Modal";
import { ModalConfirm, type Confirmation } from "~/components/common/modal/ModalConfirm";

type Width = "narrow" | "medium" | "wide";

type ModalOptions = {
    width?: Width;
    /** Só quando o conteúdo não tem ModalHeader: sem ele ninguém nomeia a janela. */
    label?: string;
};

/** O conteúdo recebe como fechar, e o que passar no `close` é o que a promessa devolve. */
type Content<T> = (close: (result?: T) => void) => ReactNode;

type ModalValue = {
    open: <T>(content: Content<T>, options?: ModalOptions) => Promise<T | undefined>;
    confirm: (request: Confirmation) => Promise<boolean>;
    close: () => void;
};

export const ModalContext = createContext<ModalValue | null>(null);

// Uma janela só para o sistema inteiro, e o conteúdo é de quem abre: confirmação, cadastro, o que
// a tela precisar. Ela devolve promessa porque abrir é uma pergunta — a tela escreve
// `const cliente = await open(...)` e continua na linha de baixo, em vez de espalhar a sequência
// entre estado, callback e efeito.
export function ModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    // Função em estado precisa vir embrulhada: o setState chamaria a função em vez de guardá-la.
    const [current, setCurrent] = useState<{ content: Content<unknown>; options: ModalOptions } | null>(null);
    const answer = useRef<(result?: unknown) => void>(() => {});

    // O conteúdo continua montado depois da resposta: a janela leva 200ms para sumir, e limpá-lo
    // agora deixaria uma moldura vazia desaparecendo. Quem o substitui é a próxima abertura.
    const answerWith = useCallback((result?: unknown) => {
        setIsOpen(false);
        answer.current(result);
        answer.current = () => {};
    }, []);

    const open = useCallback(<T,>(content: Content<T>, options: ModalOptions = {}) => {
        // Abrir por cima de uma janela que ainda não respondeu encerra a anterior como desistência.
        // Sem isto a primeira promessa nunca resolveria, e quem a esperava ficaria preso no `await`.
        answer.current(undefined);

        setCurrent({ content: content as Content<unknown>, options });
        setIsOpen(true);

        return new Promise<T | undefined>(resolve => {
            answer.current = result => resolve(result as T | undefined);
        });
    }, []);

    // Fechar pelo Escape, pelo fundo ou pelo X responde `undefined`, que aqui é "não confirmou".
    const confirm = useCallback(async (request: Confirmation) => {
        const answered = await open<boolean>(
            close => <ModalConfirm {...request} onAnswer={close} />,
            { width: "narrow" }
        );

        return answered === true;
    }, [open]);

    const value = useMemo<ModalValue>(
        () => ({ open, confirm, close: () => answerWith(undefined) }),
        [open, confirm, answerWith]
    );

    return (
        <ModalContext.Provider value={value}>
            {children}

            <Modal
                open={isOpen}
                width={current?.options.width}
                label={current?.options.label}
                onClose={() => answerWith(undefined)}
            >
                {current?.content(answerWith)}
            </Modal>
        </ModalContext.Provider>
    );
}

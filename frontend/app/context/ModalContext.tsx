import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import { Modal } from "~/components/common/modal/Modal";
import { ModalConfirm, type Confirmation } from "~/components/common/modal/ModalConfirm";

type Largura = "narrow" | "medium" | "wide";

type ModalOptions = {
    width?: Largura;
    /** Só quando o conteúdo não tem ModalHeader: sem ele ninguém nomeia a janela. */
    label?: string;
};

/** O conteúdo recebe como fechar, e o que passar no `fechar` é o que a promessa devolve. */
type Content<T> = (fechar: (resultado?: T) => void) => ReactNode;

type ModalValue = {
    abrir: <T>(conteudo: Content<T>, opcoes?: ModalOptions) => Promise<T | undefined>;
    confirmar: (pedido: Confirmation) => Promise<boolean>;
    fechar: () => void;
};

export const ModalContext = createContext<ModalValue | null>(null);

// Uma janela só para o sistema inteiro, e o conteúdo é de quem abre: confirmação, cadastro, o que
// a tela precisar. Ela devolve promessa porque abrir é uma pergunta — a tela escreve
// `const cliente = await abrir(...)` e continua na linha de baixo, em vez de espalhar a sequência
// entre estado, callback e efeito.
export function ModalProvider({ children }: { children: ReactNode }) {
    const [aberta, setAberta] = useState(false);
    // Função em estado precisa vir embrulhada: o setState chamaria a função em vez de guardá-la.
    const [janela, setJanela] = useState<{ conteudo: Content<unknown>; opcoes: ModalOptions } | null>(null);
    const responder = useRef<(resultado?: unknown) => void>(() => {});

    // O conteúdo continua montado depois da resposta: a janela leva 200ms para sumir, e limpá-lo
    // agora deixaria uma moldura vazia desaparecendo. Quem o substitui é a próxima abertura.
    const responderE = useCallback((resultado?: unknown) => {
        setAberta(false);
        responder.current(resultado);
        responder.current = () => {};
    }, []);

    const abrir = useCallback(<T,>(conteudo: Content<T>, opcoes: ModalOptions = {}) => {
        setJanela({ conteudo: conteudo as Content<unknown>, opcoes });
        setAberta(true);

        return new Promise<T | undefined>(resolve => {
            responder.current = resultado => resolve(resultado as T | undefined);
        });
    }, []);

    // Fechar pelo Escape, pelo fundo ou pelo X responde `undefined`, que aqui é "não confirmou".
    const confirmar = useCallback(async (pedido: Confirmation) => {
        const resposta = await abrir<boolean>(
            fechar => <ModalConfirm {...pedido} onAnswer={fechar} />,
            { width: "narrow" }
        );

        return resposta === true;
    }, [abrir]);

    const valor = useMemo<ModalValue>(
        () => ({ abrir, confirmar, fechar: () => responderE(undefined) }),
        [abrir, confirmar, responderE]
    );

    return (
        <ModalContext.Provider value={valor}>
            {children}

            <Modal
                open={aberta}
                width={janela?.opcoes.width}
                label={janela?.opcoes.label}
                onClose={() => responderE(undefined)}
            >
                {janela?.conteudo(responderE)}
            </Modal>
        </ModalContext.Provider>
    );
}

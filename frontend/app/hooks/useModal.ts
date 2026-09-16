import { useContext } from "react";

import { ModalContext } from "~/context/ModalContext";

/** Fora do provider é erro de montagem: a janela nunca apareceria e a promessa nunca responderia. */
export function useModal() {
    const contexto = useContext(ModalContext);

    if (!contexto) throw new Error("useModal precisa do ModalProvider acima na árvore.");

    return contexto;
}

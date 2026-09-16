import { useContext } from "react";

import { NotificationContext } from "~/context/NotificationContext";

/** Fora do provider é erro de montagem, não um caso a tratar: melhor estourar aqui do que avisar no vazio. */
export function useNotification() {
    const contexto = useContext(NotificationContext);

    if (!contexto) throw new Error("useNotification precisa do NotificationProvider acima na árvore.");

    return contexto;
}

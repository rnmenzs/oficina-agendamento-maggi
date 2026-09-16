import { useContext } from "react";

import { NotificationContext } from "~/context/NotificationContext";

/** Fora do provider é erro de montagem, não um caso a tratar: melhor estourar aqui do que avisar no vazio. */
export function useNotification() {
    const context = useContext(NotificationContext);

    if (!context) throw new Error("useNotification precisa do NotificationProvider acima na árvore.");

    return context;
}

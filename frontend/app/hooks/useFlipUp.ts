import { useLayoutEffect, useState, type RefObject } from "react";

/** Sem isto, uma lista aberta no rodapé da página nasce fora da tela e nada rola até ela. */
export function useFlipUp(anchor: RefObject<HTMLElement | null>, open: boolean, height: number) {
    const [up, setUp] = useState(false);

    // Antes da pintura: medir depois deixaria o painel aparecer embaixo e pular para cima.
    useLayoutEffect(() => {
        if (!open) return;

        const field = anchor.current?.getBoundingClientRect();
        if (!field) return;

        setUp(window.innerHeight - field.bottom < height && field.top > height);
    }, [anchor, open, height]);

    return open && up;
}

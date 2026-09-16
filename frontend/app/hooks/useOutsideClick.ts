import { useEffect, useRef, type RefObject } from "react";

export function useOutsideClick(
    ref: RefObject<HTMLElement | null>,
    active: boolean,
    onClose: () => void
) {
    // Quem chama costuma passar uma função nova a cada render. Sem o ref, os ouvintes sairiam e
    // voltariam a cada tecla digitada.
    const fechar = useRef(onClose);

    fechar.current = onClose;

    useEffect(() => {
        if (!active) return;

        function onPointerDown(event: MouseEvent) {
            if (!ref.current?.contains(event.target as Node)) fechar.current();
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") fechar.current();
        }

        // Sair de Tab tira o foco mas não dispara mousedown: sem isto o popover ficaria aberto,
        // solto na tela, depois que a pessoa já foi para o campo seguinte. relatedTarget nulo é
        // clique em área sem foco, que o mousedown acima já cobre.
        function onFocusOut(event: FocusEvent) {
            const indo = event.relatedTarget as Node | null;

            if (indo && !ref.current?.contains(indo)) fechar.current();
        }

        const caixa = ref.current;

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        caixa?.addEventListener("focusout", onFocusOut);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
            caixa?.removeEventListener("focusout", onFocusOut);
        };
    }, [ref, active]);
}

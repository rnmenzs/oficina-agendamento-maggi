import { useEffect, useRef, type RefObject } from "react";

export function useOutsideClick(
    ref: RefObject<HTMLElement | null>,
    active: boolean,
    onClose: () => void
) {
    // Quem chama costuma passar uma função nova a cada render. Sem o ref, os ouvintes sairiam e
    // voltariam a cada tecla digitada. A escrita vai num efeito porque o corpo do render tem que
    // ser puro: um render descartado deixaria o ref com valor que nunca foi confirmado.
    const close = useRef(onClose);

    useEffect(() => {
        close.current = onClose;
    });

    useEffect(() => {
        if (!active) return;

        function onPointerDown(event: MouseEvent) {
            if (!ref.current?.contains(event.target as Node)) close.current();
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") close.current();
        }

        // Sair de Tab tira o foco mas não dispara mousedown: sem isto o popover ficaria aberto,
        // solto na tela, depois que a pessoa já foi para o campo seguinte. relatedTarget nulo é
        // clique em área sem foco, que o mousedown acima já cobre.
        function onFocusOut(event: FocusEvent) {
            const going = event.relatedTarget as Node | null;

            if (going && !ref.current?.contains(going)) close.current();
        }

        const box = ref.current;

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        box?.addEventListener("focusout", onFocusOut);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
            box?.removeEventListener("focusout", onFocusOut);
        };
    }, [ref, active]);
}

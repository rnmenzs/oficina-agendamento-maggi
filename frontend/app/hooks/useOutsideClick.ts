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

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [ref, active]);
}

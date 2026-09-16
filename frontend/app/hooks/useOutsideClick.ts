import { useEffect, type RefObject } from "react";

export function useOutsideClick(
    ref: RefObject<HTMLElement | null>,
    active: boolean,
    onClose: () => void
) {
    useEffect(() => {
        if (!active) return;

        function onPointerDown(event: MouseEvent) {
            if (!ref.current?.contains(event.target as Node)) onClose();
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") onClose();
        }

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [ref, active, onClose]);
}

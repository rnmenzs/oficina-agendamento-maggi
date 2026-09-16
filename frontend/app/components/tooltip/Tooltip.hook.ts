import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FocusEvent } from "react";

const DELAY = 150;
const GAP = 8;

type Spot = {
    left: number;
    top: number;
};

export function useTooltip() {
    const [open, setOpen] = useState(false);
    const [spot, setSpot] = useState<Spot | null>(null);
    const trigger = useRef<HTMLSpanElement>(null);
    const bubble = useRef<HTMLDivElement>(null);
    const timer = useRef(0);

    const hide = useCallback(() => {
        clearTimeout(timer.current);
        setOpen(false);
        setSpot(null);
    }, []);

    function show() {
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setOpen(true), DELAY);
    }

    function onFocus(event: FocusEvent) {
        if ((event.target as HTMLElement).matches(":focus-visible")) setOpen(true);
    }

    // A bolha precisa estar na tela para ser medida, então nasce sem lugar e o ganha depois.
    useLayoutEffect(() => {
        if (!open) return;

        const area = trigger.current?.getBoundingClientRect();
        const box = bubble.current?.getBoundingClientRect();
        if (!area || !box) return;

        const above = area.top - box.height - GAP >= 0;

        setSpot({
            left: Math.round(Math.min(
                Math.max(area.left + (area.width - box.width) / 2, GAP),
                window.innerWidth - box.width - GAP
            )),
            top: Math.round(above ? area.top - box.height - GAP : area.bottom + GAP)
        });
    }, [open]);

    useEffect(() => {
        if (!open) return;

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") hide();
        }

        addEventListener("keydown", onKeyDown);
        addEventListener("scroll", hide, true);
        addEventListener("resize", hide);

        return () => {
            removeEventListener("keydown", onKeyDown);
            removeEventListener("scroll", hide, true);
            removeEventListener("resize", hide);
        };
    }, [open, hide]);

    return { open, spot, trigger, bubble, show, hide, onFocus };
}

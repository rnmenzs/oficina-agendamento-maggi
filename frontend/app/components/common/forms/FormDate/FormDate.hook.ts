import { useId, useRef, useState, type KeyboardEvent } from "react";

import { useFlipUp } from "~/hooks/useFlipUp";
import { useOutsideClick } from "~/hooks/useOutsideClick";
import type { Day } from "~/types/TypeCommon";
import { addDays, addMonths, fromDay, toDay } from "~/utils/date";

// O calendário tem altura fixa: seis semanas, cabeçalho e a folga de `mt-1`.
const HEIGHT = 314;

// Dia em ISO compara direito como texto: "2026-09-02" < "2026-09-16" sem precisar virar Date.
const blocked = (day: Day, min?: Day, max?: Day) =>
    Boolean((min && day < min) || (max && day > max));

type UseFormDate = {
    value?: Day;
    defaultValue?: Day;
    min?: Day;
    max?: Day;
    onChange?: (day: Day) => void;
};

export function useFormDate({ value, defaultValue, min, max, onChange }: UseFormDate) {
    const start = value ?? defaultValue ?? toDay(new Date());
    const [internal, setInternal] = useState(defaultValue ?? "");
    const [open, setOpen] = useState(false);
    const [month, setMonth] = useState(() => fromDay(start));
    const [cursor, setCursor] = useState<Day>(start);
    const box = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const id = useId();

    const current = value ?? internal;
    const today = toDay(new Date());

    useOutsideClick(box, open, () => setOpen(false));

    const up = useFlipUp(box, open, HEIGHT);

    // Fechar desmonta o calendário, e o foco cairia no <body> — quem usa teclado seria jogado para
    // o topo da página. Só devolve se o foco ainda estava lá dentro: clique fora é outra intenção.
    function close() {
        const inside = box.current?.contains(document.activeElement);

        setOpen(false);

        if (inside) trigger.current?.focus();
    }

    function focus(day: Day) {
        requestAnimationFrame(() => {
            box.current?.querySelector<HTMLButtonElement>(`[data-day="${day}"]`)?.focus();
        });
    }

    function show(day: Day) {
        setCursor(day);
        setMonth(fromDay(day));
        focus(day);
    }

    function choose(day: Day) {
        if (blocked(day, min, max)) return;

        setInternal(day);
        close();
        onChange?.(day);
    }

    function toggle() {
        const at = current || today;

        setCursor(at);
        setMonth(fromDay(at));
        setOpen(wasOpen => !wasOpen);

        if (!open) focus(at);
    }

    function onKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            event.preventDefault();

            return close();
        }

        const days = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];

        if (days !== undefined) {
            event.preventDefault();

            return show(toDay(addDays(fromDay(cursor), days)));
        }

        if (event.key === "PageUp" || event.key === "PageDown") {
            event.preventDefault();

            return show(toDay(addMonths(fromDay(cursor), event.key === "PageUp" ? -1 : 1)));
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            choose(cursor);
        }
    }

    return {
        id, box, trigger, open, up, month, cursor, current, today, choose, toggle, onKeyDown, close,
        isBlocked: (day: Day) => blocked(day, min, max),
        goToMonth: (step: number) => setMonth(addMonths(month, step))
    };
}

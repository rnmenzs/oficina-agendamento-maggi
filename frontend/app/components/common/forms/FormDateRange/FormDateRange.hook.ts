import { useId, useRef, useState, type KeyboardEvent } from "react";

import { useFlipUp } from "~/hooks/useFlipUp";
import { useOutsideClick } from "~/hooks/useOutsideClick";
import type { Day, DayRange } from "~/types/TypeCommon";
import { addDays, addMonths, fromDay, toDay } from "~/utils/date";
import type { CalendarDayState } from "../FormCalendar";

// Calendário, cabeçalho e o rodapé com o "Limpar", mais a folga de `mt-1`.
const HEIGHT = 366;

const blocked = (day: Day, min?: Day, max?: Day) =>
    Boolean((min && day < min) || (max && day > max));

const ordered = (a: Day, b: Day): DayRange => (b < a ? { from: b, to: a } : { from: a, to: b });

type UseFormDateRange = {
    value: DayRange;
    min?: Day;
    max?: Day;
    onChange: (range: DayRange) => void;
};

export function useFormDateRange({ value, min, max, onChange }: UseFormDateRange) {
    const today = toDay(new Date());
    const start = value.from || today;
    const [open, setOpen] = useState(false);
    const [anchor, setAnchor] = useState<Day>("");
    const [hover, setHover] = useState<Day>("");
    const [cursor, setCursor] = useState<Day>(start);
    const [month, setMonth] = useState(() => fromDay(start));
    const box = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const id = useId();

    // Fechar desmonta o calendário, e o foco cairia no <body> — quem usa teclado seria jogado para
    // o topo da página. Só devolve se o foco ainda estava lá dentro: clique fora é outra intenção.
    function close() {
        const inside = box.current?.contains(document.activeElement);

        setOpen(false);
        setAnchor("");
        setHover("");

        if (inside) trigger.current?.focus();
    }

    useOutsideClick(box, open, close);

    const up = useFlipUp(box, open, HEIGHT);

    function focus(day: Day) {
        requestAnimationFrame(() => {
            box.current?.querySelector<HTMLButtonElement>(`[data-day="${day}"]`)?.focus();
        });
    }

    function show(day: Day) {
        setCursor(day);
        setMonth(fromDay(day));
        // O teclado assume a prévia: sem zerar o hover, a faixa continuaria presa ao último dia
        // por onde o mouse passou.
        setHover("");
        focus(day);
    }

    function toggle() {
        const at = value.from || today;

        setCursor(at);
        setMonth(fromDay(at));
        setAnchor("");
        setHover("");
        setOpen(wasOpen => !wasOpen);

        if (!open) focus(at);
    }

    // Dois cliques fecham um período: o primeiro guarda uma ponta, o segundo devolve a faixa
    // pronta. Nada sai daqui no meio do caminho — quem escuta receberia meio período e, na agenda,
    // isso é uma consulta à API por clique.
    function choose(day: Day) {
        if (blocked(day, min, max)) return;

        if (!anchor) {
            setAnchor(day);
            setHover(day);
            setCursor(day);

            return;
        }

        onChange(ordered(anchor, day));
        close();
    }

    function clear() {
        onChange({ from: "", to: "" });
        close();
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

    // Enquanto a segunda ponta não vem, a faixa é a que o mouse — ou o cursor do teclado — desenha.
    const range = anchor ? ordered(anchor, hover || cursor) : value;

    function stateOf(day: Day): CalendarDayState {
        const { from, to } = range;

        if (!from || !to) {
            const single = from || to;

            return single && day === single ? "single" : null;
        }

        if (day === from) return from === to ? "single" : "start";
        if (day === to) return "end";

        return day > from && day < to ? "inside" : null;
    }

    return {
        id, box, trigger, open, up, month, cursor, today, range, stateOf, choose, clear,
        toggle, onKeyDown,
        choosing: Boolean(anchor),
        onHover: (day: Day | null) => setHover(day ?? ""),
        isBlocked: (day: Day) => blocked(day, min, max),
        goToMonth: (step: number) => setMonth(addMonths(month, step))
    };
}

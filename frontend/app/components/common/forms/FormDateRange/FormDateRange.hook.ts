import { useId, useRef, useState, type KeyboardEvent } from "react";

import { useFlipUp } from "~/hooks/useFlipUp";
import { useOutsideClick } from "~/hooks/useOutsideClick";
import type { Day, DayRange } from "~/types/TypeCommon";
import { addDays, addMonths, fromDay, toDay } from "~/utils/date";
import type { CalendarDayState } from "../FormCalendar";

// Calendário, cabeçalho e o rodapé com o "Limpar", mais a folga de `mt-1`.
const ALTURA = 366;

const blocked = (day: Day, min?: Day, max?: Day) =>
    Boolean((min && day < min) || (max && day > max));

const ordenar = (a: Day, b: Day): DayRange => (b < a ? { from: b, to: a } : { from: a, to: b });

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
    const [inicio, setInicio] = useState<Day>("");
    const [hover, setHover] = useState<Day>("");
    const [cursor, setCursor] = useState<Day>(start);
    const [month, setMonth] = useState(() => fromDay(start));
    const box = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const id = useId();

    // Fechar desmonta o calendário, e o foco cairia no <body> — quem usa teclado seria jogado para
    // o topo da página. Só devolve se o foco ainda estava lá dentro: clique fora é outra intenção.
    function fechar() {
        const dentro = box.current?.contains(document.activeElement);

        setOpen(false);
        setInicio("");
        setHover("");

        if (dentro) trigger.current?.focus();
    }

    useOutsideClick(box, open, fechar);

    const acima = useFlipUp(box, open, ALTURA);

    function focar(day: Day) {
        requestAnimationFrame(() => {
            box.current?.querySelector<HTMLButtonElement>(`[data-day="${day}"]`)?.focus();
        });
    }

    function mostrar(day: Day) {
        setCursor(day);
        setMonth(fromDay(day));
        // O teclado assume a prévia: sem zerar o hover, a faixa continuaria presa ao último dia
        // por onde o mouse passou.
        setHover("");
        focar(day);
    }

    function toggle() {
        const at = value.from || today;

        setCursor(at);
        setMonth(fromDay(at));
        setInicio("");
        setHover("");
        setOpen(aberto => !aberto);

        if (!open) focar(at);
    }

    // Dois cliques fecham um período: o primeiro guarda uma ponta, o segundo devolve a faixa
    // pronta. Nada sai daqui no meio do caminho — quem escuta receberia meio período e, na agenda,
    // isso é uma consulta à API por clique.
    function escolher(day: Day) {
        if (blocked(day, min, max)) return;

        if (!inicio) {
            setInicio(day);
            setHover(day);
            setCursor(day);

            return;
        }

        onChange(ordenar(inicio, day));
        fechar();
    }

    function limpar() {
        onChange({ from: "", to: "" });
        fechar();
    }

    function onKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            event.preventDefault();

            return fechar();
        }

        const dias = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];

        if (dias !== undefined) {
            event.preventDefault();

            return mostrar(toDay(addDays(fromDay(cursor), dias)));
        }

        if (event.key === "PageUp" || event.key === "PageDown") {
            event.preventDefault();

            return mostrar(toDay(addMonths(fromDay(cursor), event.key === "PageUp" ? -1 : 1)));
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            escolher(cursor);
        }
    }

    // Enquanto a segunda ponta não vem, a faixa é a que o mouse — ou o cursor do teclado — desenha.
    const faixa = inicio ? ordenar(inicio, hover || cursor) : value;

    function stateOf(day: Day): CalendarDayState {
        const { from, to } = faixa;

        if (!from || !to) {
            const unico = from || to;

            return unico && day === unico ? "single" : null;
        }

        if (day === from) return from === to ? "single" : "start";
        if (day === to) return "end";

        return day > from && day < to ? "inside" : null;
    }

    return {
        id, box, trigger, open, acima, month, cursor, today, faixa, stateOf, escolher, limpar,
        toggle, onKeyDown,
        escolhendo: Boolean(inicio),
        aoPassar: (day: Day | null) => setHover(day ?? ""),
        isBlocked: (day: Day) => blocked(day, min, max),
        goToMonth: (step: number) => setMonth(addMonths(month, step))
    };
}

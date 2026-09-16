import type { DayRange } from "~/types/TypeCommon";
import { addDays, formatDay, formatDayLong, toDay } from "./date";

export type PeriodShortcut = "hoje" | "amanha" | "semana" | "tudo";

export const SHORTCUTS: readonly { value: PeriodShortcut; label: string }[] = [
    { value: "hoje", label: "Hoje" },
    { value: "amanha", label: "Amanhã" },
    { value: "semana", label: "Esta semana" },
    { value: "tudo", label: "Tudo" }
];

const comMaiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

// A semana é a que o calendário mostra, de domingo a sábado, e não os próximos sete dias.
function semanaDe(base: Date): DayRange {
    const domingo = addDays(base, -base.getDay());

    return { from: toDay(domingo), to: toDay(addDays(domingo, 6)) };
}

export function periodOf(shortcut: PeriodShortcut, today: Date): DayRange {
    if (shortcut === "tudo") return { from: "", to: "" };
    if (shortcut === "semana") return semanaDe(today);

    const dia = toDay(shortcut === "amanha" ? addDays(today, 1) : today);

    return { from: dia, to: dia };
}

/** Qual atalho o período representa, se representar algum: é esse que fica marcado. */
export function shortcutOf(period: DayRange, today: Date): PeriodShortcut | null {
    const atalho = SHORTCUTS.find(({ value }) => {
        const esperado = periodOf(value, today);

        return esperado.from === period.from && esperado.to === period.to;
    });

    return atalho?.value ?? null;
}

/** O que o subtítulo da agenda diz sobre o período que está na tela. */
export function periodLabel(period: DayRange, today: Date): string {
    const { from, to } = period;

    switch (shortcutOf(period, today)) {
        case "tudo": return "Todos os serviços da oficina";
        case "hoje": return `Hoje, ${formatDayLong(from)}`;
        case "amanha": return `Amanhã, ${formatDayLong(from)}`;
        case "semana": return `Esta semana, de ${formatDay(from)} a ${formatDay(to)}`;
    }

    if (from && from === to) return comMaiuscula(formatDayLong(from));
    if (from && to) return `De ${formatDay(from)} a ${formatDay(to)}`;

    return from ? `A partir de ${formatDay(from)}` : `Até ${formatDay(to)}`;
}

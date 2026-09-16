import type { Day } from "~/types/TypeCommon";

export const WEEKDAY_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

const MONTHS = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
] as const;

// Seis semanas sempre, mesmo quando cinco bastariam: a altura do calendário não muda ao trocar de
// mês, e o que está embaixo dele não pula.
const WEEKS = 6;

// new Date("2026-09-16") é lido como meia-noite em UTC, e num fuso negativo isso volta um dia.
// Montar a data a partir das partes mantém o dia que está escrito.
export function fromDay(day: Day): Date {
    const [year, month, date] = day.split("-").map(Number);

    return new Date(year ?? 0, (month ?? 1) - 1, date ?? 1);
}

// toISOString() cai no mesmo problema ao contrário: converte para UTC antes de cortar a data.
export function toDay(date: Date): Day {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dayOfMonth = String(date.getDate()).padStart(2, "0");

    return `${date.getFullYear()}-${month}-${dayOfMonth}`;
}

export function formatDay(day: Day): string {
    const [year, month, date] = day.split("-");

    return `${date}/${month}/${year}`;
}

export function monthLabel(date: Date): string {
    return `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

// O dia é preservado, e encolhe quando não existe no mês de destino: 31/01 mais um mês é 28/02,
// não 03/03, que é onde o Date cai sozinho.
export function addMonths(date: Date, months: number): Date {
    const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();

    return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), last));
}

export function addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** As seis semanas que cobrem o mês, completadas com as bordas dos meses vizinhos. */
export function monthGrid(month: Date): Date[][] {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = addDays(first, -first.getDay());

    return Array.from({ length: WEEKS }, (_, week) =>
        Array.from({ length: 7 }, (_, weekday) => addDays(start, week * 7 + weekday)));
}

import type { Day, Instant } from "~/types/TypeCommon";

/**
 * A oficina atende num fuso só, e é nele que dia e hora são lidos — não no de quem abre a tela.
 * Sem isto, a mesma agenda vista de outro fuso mostraria horários deslocados e ofereceria faixas
 * que a API recusa: quem decide lá é o horário da oficina.
 */
export const WORKSHOP_TIME_ZONE = "America/Sao_Paulo";

// "sv-SE" formata como "2026-09-16 09:00", que já é a ordem que a gente quer partir.
const inWorkshop = new Intl.DateTimeFormat("sv-SE", {
    timeZone: WORKSHOP_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    hour12: false
});

// O offset é lido do próprio fuso, e não fixado em -03:00: o Brasil não tem horário de verão
// desde 2019, mas a regra pode voltar, e aí a conta muda sozinha.
function offsetAt(instant: Date): string {
    const name = new Intl.DateTimeFormat("en-US", {
        timeZone: WORKSHOP_TIME_ZONE, timeZoneName: "longOffset"
    }).formatToParts(instant).find(part => part.type === "timeZoneName")?.value ?? "";

    const offset = name.replace("GMT", "");

    // Em UTC o Intl devolve só "GMT", e o que sobra é vazio: sem o formato certo, a data cairia no
    // fuso do navegador sem avisar. Aí vale mais o deslocamento conhecido da oficina.
    return /^[+-]\d{2}:\d{2}$/.test(offset) ? offset : "-03:00";
}

/** O dia e a hora que um instante representa na oficina: `["2026-09-16", "09:00"]`. */
export function workshopParts(instant: Instant | Date): [Day, string] {
    const [day, time] = inWorkshop.format(new Date(instant)).split(" ");

    return [day ?? "", time ?? ""];
}

export const WEEKDAY_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

const SHORT_WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

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

/** Dia que o resto do código pode usar sem conferir: veio da URL, que qualquer um edita. */
export function isDay(value: string | null): value is Day {
    return Boolean(value) && /^\d{4}-\d{2}-\d{2}$/.test(value!) && !Number.isNaN(fromDay(value!).getTime());
}

export function formatDay(day: Day): string {
    const [year, month, date] = day.split("-");

    return `${date}/${month}/${year}`;
}

/** Como a agenda mostra o dia: "16/09 qua". O dia da semana ajuda a se localizar na lista. */
export function formatDayShort(day: Day): string {
    const data = fromDay(day);
    const [dia, mes] = [data.getDate(), data.getMonth() + 1].map(n => String(n).padStart(2, "0"));

    return `${dia}/${mes} ${SHORT_WEEKDAYS[data.getDay()]}`;
}

/** Dia com o da semana na frente: "qua, 16/09/2026". É como a confirmação mostra a data. */
export function formatDayWithWeekday(day: Day): string {
    return `${SHORT_WEEKDAYS[fromDay(day).getDay()]}, ${formatDay(day)}`;
}

/** Dia por extenso, para o subtítulo da agenda: "quarta-feira, 16 de setembro de 2026". */
export function formatDayLong(day: Day): string {
    return fromDay(day).toLocaleDateString("pt-BR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
}

export function formatTime(instant: Instant): string {
    return workshopParts(instant)[1];
}

/**
 * O instante que o dia e a hora escolhidos representam **na oficina**. O ISO sai em UTC, que é
 * como a API recebe, mas o deslocamento aplicado é o do fuso da oficina, não o do navegador.
 */
export function instantOf(day: Day, time: string): Instant {
    const noon = new Date(`${day}T12:00:00Z`);

    return new Date(`${day}T${time}:00${offsetAt(noon)}`).toISOString();
}

/** O dia em que um instante cai para a oficina. */
export function dayOf(instant: Instant): Day {
    return workshopParts(instant)[0];
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

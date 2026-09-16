import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Day } from "~/types/TypeCommon";
import { monthGrid, monthLabel, toDay, WEEKDAY_INITIALS } from "~/utils/date";

/** O papel do dia na escolha: sozinho, ponta de uma faixa, miolo dela, ou nada. */
export type CalendarDayState = "single" | "start" | "end" | "inside" | null;

const CELL = "flex size-9 cursor-pointer items-center justify-center text-sm transition-colors";

const MONTH_BUTTON = `
    cursor-pointer rounded-sm p-1 text-muted transition-colors
    hover:bg-surface-alt hover:text-ink
`;

const PONTA = "bg-primary font-semibold text-on-primary";

// As pontas arredondam só do lado de fora da faixa, e o miolo é reto: assim os dias se emendam
// numa barra contínua em vez de virarem uma fileira de pastilhas soltas.
const STATE: Record<NonNullable<CalendarDayState>, string> = {
    single: `${PONTA} rounded-sm`,
    start: `${PONTA} rounded-l-sm`,
    end: `${PONTA} rounded-r-sm`,
    inside: "bg-primary-soft text-primary"
};

type FormCalendarProps = {
    month: Date;
    cursor: Day;
    today: Day;
    stateOf: (day: Day) => CalendarDayState;
    isBlocked: (day: Day) => boolean;
    onMonth: (step: number) => void;
    onChoose: (day: Day) => void;
    onHover?: (day: Day | null) => void;
};

/** O mês em si, com a navegação. Quem usa decide o que cada dia significa pelo `stateOf`. */
export function FormCalendar({
    month, cursor, today, stateOf, isBlocked, onMonth, onChoose, onHover
}: FormCalendarProps) {
    return (
        <>
            <div className="mb-2 flex items-center justify-between gap-2">
                <button
                    type="button"
                    aria-label="Mês anterior"
                    onClick={() => onMonth(-1)}
                    className={MONTH_BUTTON}
                >
                    <ChevronLeft size={16} aria-hidden />
                </button>

                <span aria-live="polite" className="text-sm font-semibold first-letter:uppercase">
                    {monthLabel(month)}
                </span>

                <button
                    type="button"
                    aria-label="Próximo mês"
                    onClick={() => onMonth(1)}
                    className={MONTH_BUTTON}
                >
                    <ChevronRight size={16} aria-hidden />
                </button>
            </div>

            <div aria-hidden className="grid grid-cols-7">
                {WEEKDAY_INITIALS.map((initial, at) => (
                    <span
                        key={at}
                        className="flex size-9 items-center justify-center text-xs font-semibold text-muted"
                    >
                        {initial}
                    </span>
                ))}
            </div>

            <div role="grid" onMouseLeave={() => onHover?.(null)}>
                {monthGrid(month).map((week, at) => (
                    <div key={at} role="row" className="grid grid-cols-7">
                        {week.map(date => {
                            const day = toDay(date);
                            const estado = stateOf(day);
                            const barrado = isBlocked(day);
                            const fora = date.getMonth() !== month.getMonth();

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    role="gridcell"
                                    data-day={day}
                                    aria-disabled={barrado}
                                    aria-selected={estado !== null}
                                    aria-current={day === today ? "date" : undefined}
                                    tabIndex={day === cursor ? 0 : -1}
                                    onClick={() => onChoose(day)}
                                    onMouseEnter={() => onHover?.(day)}
                                    className={`${CELL} ${
                                        barrado ? "cursor-not-allowed text-muted/40" : ""} ${
                                        estado
                                            ? STATE[estado]
                                            : `rounded-sm ${barrado ? "" : "hover:bg-surface-alt"} ${
                                                fora ? "text-muted/60" : ""} ${
                                                day === today ? "font-semibold text-primary" : ""}`}`}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </>
    );
}

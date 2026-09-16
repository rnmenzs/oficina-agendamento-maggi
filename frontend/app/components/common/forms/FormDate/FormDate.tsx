import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import type { Day } from "~/types/TypeCommon";
import { formatDay, monthGrid, monthLabel, toDay, WEEKDAY_INITIALS } from "~/utils/date";
import { describedBy, FormField } from "../FormField";
import { useFormDate } from "./FormDate.hook";

const BASE = `
    flex min-h-10 w-full items-center justify-between gap-2 rounded-sm border
    bg-surface px-2.5 py-2 text-left text-sm text-ink transition-colors
`;

const CELL = `
    flex size-9 cursor-pointer items-center justify-center rounded-sm text-sm
    transition-colors hover:bg-surface-alt
`;

const MONTH_BUTTON = `
    cursor-pointer rounded-sm p-1 text-muted transition-colors
    hover:bg-surface-alt hover:text-ink
`;

function boxClasses(invalid: boolean, disabled: boolean, open: boolean): string {
    if (disabled) return `${BASE} cursor-not-allowed border-line bg-surface-alt text-muted`;

    const border = open
        ? "border-primary"
        : invalid ? "border-error bg-error-bg" : "border-line-strong";

    return `${BASE} cursor-pointer hover:border-muted ${border}`;
}

type FormDateProps = {
    label: string;
    required?: boolean;
    hint?: ReactNode;
    error?: string;
    wide?: boolean;
    name?: string;
    value?: Day;
    defaultValue?: Day;
    min?: Day;
    max?: Day;
    placeholder?: string;
    disabled?: boolean;
    onChange?: (day: Day) => void;
};

export function FormDate({
    label, required, hint, error, wide, name, value, defaultValue, min, max,
    placeholder = "dd/mm/aaaa", disabled = false, onChange
}: FormDateProps) {
    const calendar = useFormDate({ value, defaultValue, min, max, onChange });

    return (
        <FormField
            id={calendar.id}
            label={label}
            required={required}
            hint={hint}
            error={error}
            wide={wide}
        >
            <div ref={calendar.box} className="relative">
                {name && <input type="hidden" name={name} value={calendar.current} />}

                <button
                    ref={calendar.trigger}
                    type="button"
                    id={calendar.id}
                    role="combobox"
                    disabled={disabled}
                    aria-haspopup="dialog"
                    aria-expanded={calendar.open}
                    aria-required={required}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy(calendar.id, error, hint)}
                    onClick={calendar.toggle}
                    className={boxClasses(Boolean(error), disabled, calendar.open)}
                >
                    <span className={calendar.current ? "" : "text-muted"}>
                        {calendar.current ? formatDay(calendar.current) : placeholder}
                    </span>
                    <CalendarDays size={16} aria-hidden className="shrink-0 text-muted" />
                </button>

                {calendar.open && (
                    <div
                        role="dialog"
                        aria-label={label}
                        onKeyDown={calendar.onKeyDown}
                        className="absolute top-full left-0 z-40 mt-1 w-max rounded-card border
                            border-line-strong bg-surface p-3 shadow-lg"
                    >
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <button
                                type="button"
                                aria-label="Mês anterior"
                                onClick={() => calendar.goToMonth(-1)}
                                className={MONTH_BUTTON}
                            >
                                <ChevronLeft size={16} aria-hidden />
                            </button>

                            <span
                                aria-live="polite"
                                className="text-sm font-semibold first-letter:uppercase"
                            >
                                {monthLabel(calendar.month)}
                            </span>

                            <button
                                type="button"
                                aria-label="Próximo mês"
                                onClick={() => calendar.goToMonth(1)}
                                className={MONTH_BUTTON}
                            >
                                <ChevronRight size={16} aria-hidden />
                            </button>
                        </div>

                        <div aria-hidden className="grid grid-cols-7">
                            {WEEKDAY_INITIALS.map((initial, at) => (
                                <span
                                    key={at}
                                    className="flex size-9 items-center justify-center text-xs
                                        font-semibold text-muted"
                                >
                                    {initial}
                                </span>
                            ))}
                        </div>

                        <div role="grid" className="grid grid-cols-7">
                            {monthGrid(calendar.month).map((week, at) => (
                                // "contents" deixa a linha existir para o leitor de tela sem
                                // atrapalhar a grade do CSS.
                                <div key={at} role="row" className="contents">
                                    {week.map(date => {
                                        const day = toDay(date);
                                        const chosen = day === calendar.current;
                                        const off = date.getMonth() !== calendar.month.getMonth();
                                        const barred = calendar.isBlocked(day);

                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                role="gridcell"
                                                data-day={day}
                                                aria-disabled={barred}
                                                tabIndex={day === calendar.cursor ? 0 : -1}
                                                aria-selected={chosen}
                                                aria-current={day === calendar.today ? "date" : undefined}
                                                onClick={() => calendar.choose(day)}
                                                className={`${CELL} ${
                                                    barred
                                                        ? "cursor-not-allowed text-muted/40 hover:bg-transparent"
                                                        : off ? "text-muted/60" : ""} ${
                                                    chosen
                                                        ? "bg-primary font-semibold text-on-primary hover:bg-primary-strong"
                                                        : day === calendar.today ? "font-semibold text-primary" : ""}`}
                                            >
                                                {date.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </FormField>
    );
}

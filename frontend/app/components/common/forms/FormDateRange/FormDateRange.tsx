import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";

import type { Day, DayRange } from "~/types/TypeCommon";
import { formatDay } from "~/utils/date";
import { Button } from "../../button/Button";
import { FormCalendar } from "../FormCalendar";
import { describedBy, FormField } from "../FormField";
import { useFormDateRange } from "./FormDateRange.hook";

export type { DayRange };

const BASE = `
    flex min-h-10 w-full items-center justify-between gap-2 rounded-sm border
    bg-surface px-2.5 py-2 text-left text-sm text-ink transition-colors
`;

function boxClasses(invalid: boolean, disabled: boolean, open: boolean): string {
    if (disabled) return `${BASE} cursor-not-allowed border-line bg-surface-alt text-muted`;

    const border = open
        ? "border-primary"
        : invalid ? "border-error bg-error-bg" : "border-line-strong";

    return `${BASE} cursor-pointer hover:border-muted ${border}`;
}

function rangeLabel({ from, to }: DayRange): string {
    if (from && to) {
        return from === to ? formatDay(from) : `${formatDay(from)} – ${formatDay(to)}`;
    }


    const unico = from || to;

    return unico ? formatDay(unico) : "Nenhum período escolhido";
}

type FormDateRangeProps = {
    label?: string;
    required?: boolean;
    hint?: ReactNode;
    error?: string;
    wide?: boolean;
    fromName?: string;
    toName?: string;
    value: DayRange;
    min?: Day;
    max?: Day;
    placeholder?: string;
    disabled?: boolean;
    onChange: (range: DayRange) => void;
};

export function FormDateRange({
    label = "Período", required, hint, error, wide, fromName, toName, value, min, max,
    placeholder = "Qualquer data", disabled = false, onChange
}: FormDateRangeProps) {
    const range = useFormDateRange({ value, min, max, onChange });
    const chosen = Boolean(value.from || value.to);

    return (
        <FormField
            id={range.id}
            label={label}
            required={required}
            hint={hint}
            error={error}
            wide={wide}
        >
            <div ref={range.box} className="relative">
                {fromName && <input type="hidden" name={fromName} value={value.from} />}
                {toName && <input type="hidden" name={toName} value={value.to} />}

                <button
                    ref={range.trigger}
                    type="button"
                    id={range.id}
                    role="combobox"
                    disabled={disabled}
                    aria-haspopup="dialog"
                    aria-expanded={range.open}
                    aria-required={required}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy(range.id, error, hint)}
                    onClick={range.toggle}
                    className={boxClasses(Boolean(error), disabled, range.open)}
                >
                    <span className={chosen ? "whitespace-nowrap" : "text-muted"}>
                        {chosen ? rangeLabel(value) : placeholder}
                    </span>
                    <CalendarDays size={16} aria-hidden className="shrink-0 text-muted" />
                </button>

                {range.open && (
                    <div
                        role="dialog"
                        aria-label={label}
                        onKeyDown={range.onKeyDown}
                        className={`absolute left-0 z-40 w-max rounded-card border
                            border-line-strong bg-surface p-3 shadow-lg
                            ${range.up ? "bottom-full mb-1" : "top-full mt-1"}`}
                    >
                        <FormCalendar
                            month={range.month}
                            cursor={range.cursor}
                            today={range.today}
                            stateOf={range.stateOf}
                            isBlocked={range.isBlocked}
                            onMonth={range.goToMonth}
                            onChoose={range.choose}
                            onHover={range.onHover}
                        />

                        <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-2">
                            <span aria-live="polite" className="text-xs text-muted">
                                {range.choosing ? "Escolha o dia final" : rangeLabel(range.range)}
                            </span>

                            <Button disabled={!chosen && !range.choosing} onClick={range.clear}>
                                Limpar
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </FormField>
    );
}

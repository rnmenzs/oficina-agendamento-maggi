import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";

import type { Day } from "~/types/TypeCommon";
import { formatDay } from "~/utils/date";
import { FormCalendar } from "../FormCalendar";
import { describedBy, FormField } from "../FormField";
import { useFormDate } from "./FormDate.hook";

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
                        className={`absolute left-0 z-40 w-max rounded-card border
                            border-line-strong bg-surface p-3 shadow-lg
                            ${calendar.acima ? "bottom-full mb-1" : "top-full mt-1"}`}
                    >
                        <FormCalendar
                            month={calendar.month}
                            cursor={calendar.cursor}
                            today={calendar.today}
                            stateOf={day => (day === calendar.current ? "single" : null)}
                            isBlocked={calendar.isBlocked}
                            onMonth={calendar.goToMonth}
                            onChoose={calendar.choose}
                        />
                    </div>
                )}
            </div>
        </FormField>
    );
}

import type { ReactNode } from "react";

import type { Day } from "~/types/TypeCommon";
import { FormDate } from "./FormDate/FormDate";

export type DayRange = {
    from: Day;
    to: Day;
};

type FormDateRangeProps = {
    fromLabel?: string;
    toLabel?: string;
    required?: boolean;
    hint?: ReactNode;
    error?: string;
    fromName?: string;
    toName?: string;
    value: DayRange;
    min?: Day;
    max?: Day;
    disabled?: boolean;
    onChange: (range: DayRange) => void;
};

export function FormDateRange({
    fromLabel = "De", toLabel = "Até", required, hint, error, fromName, toName,
    value, min, max, disabled = false, onChange
}: FormDateRangeProps) {
    function changeFrom(from: Day) {
        onChange({ from, to: value.to && from > value.to ? from : value.to });
    }

    return (
        <div className="flex flex-wrap items-start gap-3">
            <FormDate
                label={fromLabel}
                name={fromName}
                required={required}
                hint={hint}
                error={error}
                value={value.from}
                min={min}
                max={max}
                disabled={disabled}
                onChange={changeFrom}
            />

            <FormDate
                label={toLabel}
                name={toName}
                required={required}
                value={value.to}
                min={value.from || min}
                max={max}
                disabled={disabled}
                onChange={to => onChange({ ...value, to })}
            />
        </div>
    );
}

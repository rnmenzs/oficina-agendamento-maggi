import { Button } from "../common/button/Button";
import { FormDateRange } from "../common/forms/FormDateRange/FormDateRange";
import { FormRadio } from "../common/forms/FormRadio";
import { FormSelect } from "../common/forms/FormSelect/FormSelect";
import type { DayRange } from "~/types/TypeCommon";
import { SHORTCUTS, type PeriodShortcut } from "~/utils/period";
import { STATUS_LABEL, STATUSES } from "~/utils/status";

const OPTIONS = STATUSES.map(status => ({ value: status, label: STATUS_LABEL[status] }));

type AppointmentFiltersProps = {
    shortcut: PeriodShortcut | null;
    period: DayRange;
    status: string;
    /** Hoje e sem status é como a tela abre, e não há o que limpar. */
    isDefault: boolean;
    onShortcut: (shortcut: PeriodShortcut) => void;
    onPeriod: (period: DayRange) => void;
    onStatus: (status: string) => void;
    onClear: () => void;
};

export function AppointmentFilters({
    shortcut, period, status, isDefault, onShortcut, onPeriod, onStatus, onClear
}: AppointmentFiltersProps) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-5 px-4 py-3.5">
            <div className="self-center">
                <FormRadio
                    label="Período"
                    hideLabel
                    options={SHORTCUTS}
                    value={shortcut ?? ""}
                    onChange={chosen => onShortcut(chosen as PeriodShortcut)}
                />
            </div>

            <div className="flex flex-wrap items-end gap-3">
                <FormDateRange value={period} onChange={onPeriod} />

                <FormSelect
                    label="Status"
                    options={OPTIONS}
                    value={status}
                    placeholder="Todos"
                    onChange={onStatus}
                />

                {!isDefault && <Button onClick={onClear}>Limpar</Button>}
            </div>
        </div>
    );
}

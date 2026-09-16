import { Button } from "../common/button/Button";
import { FormDateRange } from "../common/forms/FormDateRange/FormDateRange";
import { FormRadio } from "../common/forms/FormRadio";
import { FormSelect } from "../common/forms/FormSelect/FormSelect";
import type { DayRange } from "~/types/TypeCommon";
import { SHORTCUTS, type PeriodShortcut } from "~/utils/period";
import { STATUS_LABEL, STATUSES } from "~/utils/status";

const OPCOES = STATUSES.map(status => ({ value: status, label: STATUS_LABEL[status] }));

type AppointmentFiltersProps = {
    atalho: PeriodShortcut | null;
    periodo: DayRange;
    status: string;
    padrao: boolean;
    onAtalho: (atalho: PeriodShortcut) => void;
    onPeriodo: (periodo: DayRange) => void;
    onStatus: (status: string) => void;
    onLimpar: () => void;
};

export function AppointmentFilters({
    atalho, periodo, status, padrao, onAtalho, onPeriodo, onStatus, onLimpar
}: AppointmentFiltersProps) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-5 px-4 py-3.5">
            <div className="self-center">
                <FormRadio
                    label="Período"
                    hideLabel
                    options={SHORTCUTS}
                    value={atalho ?? ""}
                    onChange={escolha => onAtalho(escolha as PeriodShortcut)}
                />
            </div>

            <div className="flex flex-wrap items-end gap-3">
                <FormDateRange value={periodo} onChange={onPeriodo} />

                <FormSelect
                    label="Status"
                    options={OPCOES}
                    value={status}
                    placeholder="Todos"
                    onChange={onStatus}
                />

                {!padrao && <Button onClick={onLimpar}>Limpar</Button>}
            </div>
        </div>
    );
}

import { AT_THE_SAME_TIME, type Slot } from "~/utils/schedule";

const BASE = `
    flex min-h-12 cursor-pointer flex-col items-center justify-center gap-px rounded-sm border
    px-1 py-1.5 transition-colors
`;

function slotClasses(slot: Slot, chosen: boolean): string {
    if (!slot.free) return `${BASE} cursor-not-allowed border-line bg-surface-alt opacity-55`;
    if (chosen) return `${BASE} border-primary bg-primary text-on-primary`;

    return `${BASE} border-line-strong bg-surface hover:border-primary hover:bg-primary-soft`;
}

type AppointmentSlotsProps = {
    slots: readonly Slot[];
    value: string;
    onChange: (time: string) => void;
};

/**
 * As faixas do dia com a ocupação de cada uma. Mostrar o que não dá antes do clique é o que
 * transforma as regras em ajuda: sem isto, a recusa só chega depois de enviar o formulário.
 */
export function AppointmentSlots({ slots, value, onChange }: AppointmentSlotsProps) {
    const free = slots.filter(slot => slot.free).length;

    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs text-muted">
                {free} de {slots.length} horários livres. A oficina atende {AT_THE_SAME_TIME} serviços
                ao mesmo tempo, e o número embaixo de cada horário é quantas vagas sobram{" "}
                <strong className="font-semibold">durante todo o serviço</strong> — por isso ele muda
                quando a duração muda.
            </p>

            <div
                role="group"
                aria-label="Horários"
                className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-8"
            >
                {slots.map(slot => {
                    const chosen = slot.time === value;
                    const left = AT_THE_SAME_TIME - slot.taken;

                    return (
                        <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.free}
                            aria-pressed={chosen}
                            title={`${slot.time} às ${slot.endsAt}${slot.free ? "" : ` · ${slot.reason}`}`}
                            aria-label={slot.free
                                ? `${slot.time} às ${slot.endsAt}, ${left} ${left === 1 ? "vaga" : "vagas"}`
                                : `${slot.time} às ${slot.endsAt}, indisponível: ${slot.reason}`}
                            onClick={() => onChange(slot.time)}
                            className={slotClasses(slot, chosen)}
                        >
                            <span className="font-mono text-sm font-medium">{slot.time}</span>
                            <span className={`text-xs ${chosen ? "" : "text-muted"}`}>
                                {slot.free ? `${left} ${left === 1 ? "vaga" : "vagas"}` : slot.reason}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

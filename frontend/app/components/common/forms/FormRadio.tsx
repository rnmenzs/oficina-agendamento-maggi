import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";

import { describedBy, FormField } from "./FormField";

export type FormRadioOption = {
    value: string;
    label: string;
};

type FormRadioProps = {
    label: string;
    hideLabel?: boolean;
    required?: boolean;
    hint?: ReactNode;
    error?: string;
    wide?: boolean;
    options: readonly FormRadioOption[];
    value: string;
    onChange: (value: string) => void;
};

export function FormRadio({
    label, hideLabel, required, hint, error, wide, options, value, onChange
}: FormRadioProps) {
    const box = useRef<HTMLDivElement>(null);
    const id = useId();
    const escolhido = options.findIndex(option => option.value === value);

    function onKeyDown(event: KeyboardEvent) {
        const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (step === 0) return;

        event.preventDefault();

        const at = options.findIndex(option => option.value === value);
        const next = options[(at + step + options.length) % options.length];
        if (!next) return;

        onChange(next.value);
        box.current?.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)?.focus();
    }

    return (
        <FormField
            id={id}
            label={label}
            hideLabel={hideLabel}
            group
            required={required}
            hint={hint}
            error={error}
            wide={wide}
        >
            <div
                ref={box}
                role="radiogroup"
                aria-labelledby={`${id}-label`}
                aria-required={required}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy(id, error, hint)}
                onKeyDown={onKeyDown}
                className="flex flex-wrap gap-1.5"
            >
                {options.map((option, at) => {
                    const chosen = option.value === value;

                    // Nada escolhido ainda: o Tab entra pelo primeiro. Sem isto, com value vazio
                    // todos ficariam com -1 e o teclado pularia o grupo.
                    const tabulavel = escolhido === -1 ? at === 0 : chosen;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={chosen}
                            tabIndex={tabulavel ? 0 : -1}
                            data-value={option.value}
                            onClick={() => onChange(option.value)}
                            className={`min-h-9 cursor-pointer rounded-full border px-3 py-1.5 text-sm
                                font-semibold transition-colors ${chosen
                                    ? "border-primary bg-primary text-on-primary hover:bg-primary-strong"
                                    : "border-line-strong bg-surface text-muted hover:bg-surface-alt hover:text-ink"}`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </FormField>
    );
}

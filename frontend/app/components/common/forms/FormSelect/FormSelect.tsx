import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { describedBy, FormField } from "../FormField";
import { useFormSelect, type FormSelectOption } from "./FormSelect.hook";

export type { FormSelectOption };

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

type FormSelectProps = {
    label: string;
    required?: boolean;
    hint?: ReactNode;
    error?: string;
    wide?: boolean;
    name?: string;
    options: readonly FormSelectOption[];
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    disabled?: boolean;
    onChange?: (value: string) => void;
};

export function FormSelect({
    label, required, hint, error, wide, name, options, value, defaultValue,
    placeholder = "Selecionar", disabled = false, onChange
}: FormSelectProps) {
    const select = useFormSelect({ options, value, defaultValue, onChange });

    return (
        <FormField
            id={select.id}
            label={label}
            required={required}
            hint={hint}
            error={error}
            wide={wide}
        >
            <div ref={select.box} className="relative">
                {name && <input type="hidden" name={name} value={select.current} />}

                <button
                    type="button"
                    id={select.id}
                    role="combobox"
                    disabled={disabled}
                    aria-haspopup="listbox"
                    aria-required={required}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy(select.id, error, hint)}
                    aria-expanded={select.open}
                    aria-controls={select.open ? select.listId : undefined}
                    aria-activedescendant={select.open ? select.optionId(select.active) : undefined}
                    onClick={select.toggle}
                    onKeyDown={select.onKeyDown}
                    className={boxClasses(Boolean(error), disabled, select.open)}
                >
                    <span className={`truncate ${select.chosen ? "" : "text-muted"}`}>
                        {select.chosen?.label ?? placeholder}
                    </span>
                    <ChevronDown
                        size={16}
                        aria-hidden
                        className={`shrink-0 text-muted transition-transform
                            ${select.open ? "rotate-180" : ""}`}
                    />
                </button>

                {select.open && (
                    <ul
                        id={select.listId}
                        role="listbox"
                        className="absolute top-full mt-1 left-0 z-40 max-h-65 min-w-full
                            overflow-y-auto rounded-card border border-line-strong bg-surface p-1
                            shadow-lg"
                    >
                        {options.map((option, at) => (
                            <li
                                key={option.value}
                                id={select.optionId(at)}
                                role="option"
                                aria-selected={option.value === select.current}
                                onMouseEnter={() => select.setActive(at)}
                                onClick={() => select.choose(option)}
                                className={`cursor-pointer rounded-sm px-2.5 py-2 text-sm whitespace-nowrap
                                    ${at === select.active ? "bg-primary-soft text-primary" : ""}
                                    ${option.value === select.current ? "font-semibold" : ""}`}
                            >
                                {option.label}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </FormField>
    );
}

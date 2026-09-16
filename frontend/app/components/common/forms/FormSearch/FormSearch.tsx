import { Search, X } from "lucide-react";
import type { ReactNode } from "react";

import { describedBy, FormField } from "../FormField";
import { useFormSearch, type FormSearchOption } from "./FormSearch.hook";

export type { FormSearchOption };

const BASE = `
    flex min-h-10 w-full items-center gap-2 rounded-sm border bg-surface
    px-2.5 py-2 text-sm text-ink transition-colors focus-within:border-primary
`;

type FormSearchProps = {
    label: string;
    required?: boolean;
    hint?: ReactNode;
    error?: string;
    wide?: boolean;
    name?: string;
    options: readonly FormSearchOption[];
    defaultValue?: string;
    placeholder?: string;
    emptyLabel?: string;
    disabled?: boolean;
    onChange?: (value: string) => void;
};

export function FormSearch({
    label, required, hint, error, wide, name, options, defaultValue,
    placeholder = "Digite para buscar", emptyLabel = "Nada encontrado.",
    disabled = false, onChange
}: FormSearchProps) {
    const search = useFormSearch({ options, defaultValue, onChange });

    return (
        <FormField
            id={search.id}
            label={label}
            required={required}
            hint={hint}
            error={error}
            wide={wide}
        >
            <div ref={search.box} className="relative">
                {name && <input type="hidden" name={name} value={search.chosen?.value ?? ""} />}

                <div
                    className={`${BASE} ${disabled ? "cursor-not-allowed border-line bg-surface-alt" : ""}
                        ${error ? "border-error bg-error-bg" : "border-line-strong"}`}
                >
                    <Search size={16} aria-hidden className="shrink-0 text-muted" />

                    <input
                        id={search.id}
                        role="combobox"
                        autoComplete="off"
                        disabled={disabled}
                        placeholder={placeholder}
                        value={search.text}
                        aria-expanded={search.open}
                        aria-controls={search.open ? search.listId : undefined}
                        aria-activedescendant={search.open ? `${search.listId}-${search.active}` : undefined}
                        aria-required={required}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={describedBy(search.id, error, hint)}
                        onChange={event => search.type(event.target.value)}
                        onFocus={search.openList}
                        onKeyDown={search.onKeyDown}
                        className="min-w-0 flex-1 bg-transparent outline-none
                            placeholder:text-muted/70 disabled:cursor-not-allowed disabled:text-muted"
                    />

                    {search.chosen && !disabled && (
                        <button
                            type="button"
                            aria-label={`Limpar ${label.toLowerCase()}`}
                            onClick={search.clear}
                            className="shrink-0 cursor-pointer rounded-sm p-0.5 text-muted
                                transition-colors hover:bg-surface-alt hover:text-ink"
                        >
                            <X size={16} aria-hidden />
                        </button>
                    )}
                </div>

                {search.open && (
                    <ul
                        id={search.listId}
                        role="listbox"
                        className="absolute top-full left-0 z-40 mt-1 max-h-65 min-w-full
                            overflow-y-auto rounded-card border border-line-strong bg-surface p-1
                            shadow-lg"
                    >
                        {search.matches.length === 0 && (
                            <li className="px-2.5 py-2 text-sm text-muted">{emptyLabel}</li>
                        )}

                        {search.matches.map((option, at) => (
                            <li
                                key={option.value}
                                id={`${search.listId}-${at}`}
                                role="option"
                                aria-selected={at === search.active}
                                onMouseEnter={() => search.setActive(at)}
                                onClick={() => search.choose(option)}
                                className={`cursor-pointer rounded-sm px-2.5 py-2 text-sm
                                    ${at === search.active ? "bg-primary-soft text-primary" : ""}`}
                            >
                                <span className="block font-medium">{option.label}</span>
                                {option.detail && (
                                    <span className="block text-xs text-muted">{option.detail}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </FormField>
    );
}

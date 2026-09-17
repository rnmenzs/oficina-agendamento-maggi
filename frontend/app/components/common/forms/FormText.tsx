import type { LucideIcon } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";

import { describedBy, FormField } from "./FormField";

const BASE = `
    min-h-10 w-full rounded-sm border bg-surface px-2.5 py-2
    text-sm text-ink transition-colors placeholder:text-muted/70 hover:border-muted
    disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-alt
    disabled:text-muted disabled:hover:border-line
`;

// Com ícone quem desenha a caixa é o invólucro, e o campo por dentro fica sem borda: é o mesmo
// desenho do FormSearch, para um filtro e um combobox não parecerem dois controles diferentes.
const BOX = `
    flex min-h-10 w-full items-center gap-2 rounded-sm border bg-surface px-2.5 py-2
    text-sm text-ink transition-colors hover:border-muted focus-within:border-primary
`;

const INSIDE = `
    min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted/70
    disabled:cursor-not-allowed disabled:text-muted
`;

export type FormTextProps = Omit<ComponentProps<"input">, "id" | "className"> & {
    label: string;
    hint?: ReactNode;
    error?: string;
    wide?: boolean;
    icon?: LucideIcon;
};

export function FormText({ label, hint, error, wide, required, icon: Icon, ...rest }: FormTextProps) {
    const id = useId();
    const border = error ? "border-error bg-error-bg" : "border-line-strong";

    const field = (
        <input
            {...rest}
            id={id}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, error, hint)}
            className={Icon ? INSIDE : `${BASE} ${border}`}
        />
    );

    return (
        <FormField id={id} label={label} required={required} hint={hint} error={error} wide={wide}>
            {Icon
                ? (
                    <div className={`${BOX} ${border}`}>
                        <Icon size={16} aria-hidden className="shrink-0 text-muted" />
                        {field}
                    </div>
                )
                : field}
        </FormField>
    );
}

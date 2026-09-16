import { useId, type ComponentProps, type ReactNode } from "react";

import { FormField } from "./FormField";

const BASE = `
    min-h-10 w-full rounded-sm border bg-surface px-2.5 py-2
    text-sm text-ink transition-colors placeholder:text-muted/70 hover:border-muted
    disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-alt
    disabled:text-muted disabled:hover:border-line
`;

export type FormTextProps = Omit<ComponentProps<"input">, "id" | "className"> & {
    label: string;
    hint?: ReactNode;
    error?: string;
    wide?: boolean;
};

export function FormText({ label, hint, error, wide, required, ...rest }: FormTextProps) {
    const id = useId();

    return (
        <FormField id={id} label={label} required={required} hint={hint} error={error} wide={wide}>
            <input
                {...rest}
                id={id}
                required={required}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className={`${BASE} ${error ? "border-error bg-error-bg" : "border-line-strong"}`}
            />
        </FormField>
    );
}

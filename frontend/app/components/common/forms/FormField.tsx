import type { ReactNode } from "react";

type FormFieldProps = {
    id: string;
    label: string;
    hideLabel?: boolean;
    group?: boolean;
    required?: boolean;
    hint?: ReactNode;
    error?: string;
    wide?: boolean;
    children: ReactNode;
};

// O erro substitui a dica, então descreve uma coisa só. Sem isto o leitor de tela não anuncia nem
// a dica nem o erro, e quem não enxerga envia o formulário sem saber o que está errado.
export function describedBy(id: string, error?: string, hint?: ReactNode): string | undefined {
    if (error) return `${id}-error`;

    return hint ? `${id}-hint` : undefined;
}

export function FormField({
    id, label, hideLabel = false, group = false, required = false, hint, error, wide = false, children
}: FormFieldProps) {
    const classes = hideLabel
        ? "sr-only"
        : `text-xs font-semibold tracking-wider uppercase ${error ? "text-error" : "text-muted"}`;

    const content = (
        <>
            {label}
            {required && <span aria-hidden className="ml-0.5 text-error">*</span>}
        </>
    );

    return (
        <div className={`flex min-w-0 flex-col gap-1.5 ${wide ? "col-span-full" : ""}`}>
            {group
                ? <span id={`${id}-label`} className={classes}>{content}</span>
                : <label htmlFor={id} className={classes}>{content}</label>}

            {children}

            {error
                ? <span id={`${id}-error`} className="text-xs font-medium text-error">{error}</span>
                : hint && <span id={`${id}-hint`} className="text-xs text-muted">{hint}</span>}
        </div>
    );
}

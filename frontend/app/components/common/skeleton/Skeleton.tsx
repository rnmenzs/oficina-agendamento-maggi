import type { ReactNode } from "react";

type SkeletonProps = {
    className?: string;
    label?: string;
    /** `span` para caber onde só cabe texto: dentro de um título, de um parágrafo. */
    as?: "div" | "span";
    children?: ReactNode;
};

// Sem filhos é uma barra; com filhos é o invólucro de um conjunto delas, e é ele que avisa o leitor
// de tela — uma vez, e não uma por barra.
export function Skeleton({ className = "h-3 w-full", label, as: Tag = "div", children }: SkeletonProps) {
    const round = className.includes("rounded") ? "" : "rounded-sm";

    return (
        <Tag
            aria-hidden={label ? undefined : true}
            aria-busy={label ? true : undefined}
            aria-live={label ? "polite" : undefined}
            className={`${Tag === "span" ? "inline-block align-middle" : ""}
                ${children ? "" : `skeleton ${round}`} ${className}`}
        >
            {label && <span className="sr-only">{label}</span>}
            {children}
        </Tag>
    );
}

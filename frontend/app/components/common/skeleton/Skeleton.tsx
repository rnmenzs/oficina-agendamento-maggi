import type { ReactNode } from "react";

type SkeletonProps = {
    className?: string;
    label?: string;
    children?: ReactNode;
};

export function Skeleton({ className = "h-3 w-full", label, children }: SkeletonProps) {
    const round = className.includes("rounded") ? "" : "rounded-sm";

    return (
        <div
            aria-hidden={label ? undefined : true}
            aria-busy={label ? true : undefined}
            aria-live={label ? "polite" : undefined}
            className={`animate-pulse motion-reduce:animate-none ${round}
                ${children ? "" : "bg-line"} ${className}`}
        >
            {label && <span className="sr-only">{label}</span>}
            {children}
        </div>
    );
}

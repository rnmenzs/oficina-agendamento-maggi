import type { ReactNode } from "react";

type StateEmptyProps = {
    label?: string;
    title: string;
    description?: ReactNode;
    children?: ReactNode;
};

export function StateEmpty({ label, title, description, children }: StateEmptyProps) {
    return (
        <div className="flex w-full flex-col items-center gap-2 px-6 py-12 text-center">
            {label && (
                <p className="text-xs font-semibold tracking-widest text-muted uppercase">
                    {label}
                </p>
            )}
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="max-w-md text-muted">{description}</p>}
            {children && <div className="mt-2 flex flex-wrap gap-2">{children}</div>}
        </div>
    );
}

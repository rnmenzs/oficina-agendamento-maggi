import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

type StateErrorProps = {
    title?: string;
    description?: ReactNode;
    children?: ReactNode;
};

export function StateError({
    title = "Não foi possível carregar", description, children
}: StateErrorProps) {
    return (
        <div
            role="alert"
            className="flex w-full flex-col items-center gap-2 px-6 py-12 text-center"
        >
            <span className="flex size-11 items-center justify-center rounded-full bg-error-bg text-error">
                <CircleAlert size={22} aria-hidden />
            </span>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="max-w-md text-muted">{description}</p>}
            {children && <div className="mt-2 flex flex-wrap gap-2">{children}</div>}
        </div>
    );
}

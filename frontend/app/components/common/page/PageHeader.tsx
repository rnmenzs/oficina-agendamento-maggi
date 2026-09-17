import type { ReactNode } from "react";

type PageHeaderProps = {
    title: ReactNode;
    subtitle?: ReactNode;
    /** A ação primária da tela, quando existir. */
    children?: ReactNode;
};

// Alinhado pela base, não pelo topo: o botão fica na linha do título mesmo com subtítulo embaixo.
export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
                {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
            </div>

            {children && <div className="flex flex-wrap gap-2">{children}</div>}
        </header>
    );
}

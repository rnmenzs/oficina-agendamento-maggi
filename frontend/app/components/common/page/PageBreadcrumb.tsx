import { Link } from "react-router";

export type Crumb = {
    label: string;
    to?: string;
};

/**
 * Onde a pessoa está, e o caminho de volta. O último item é o lugar atual e não vira link:
 * link que leva para a própria página é ruído para quem navega por teclado.
 */
export function PageBreadcrumb({ trail }: { trail: readonly Crumb[] }) {
    return (
        <nav aria-label="Trilha">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
                {trail.map((crumb, at) => (
                    <li key={crumb.label} className="flex items-center gap-1.5">
                        {at > 0 && <span aria-hidden className="text-line-strong">/</span>}
                        {crumb.to
                            ? <Link to={crumb.to} className="text-primary no-underline hover:underline">{crumb.label}</Link>
                            : <span aria-current="page">{crumb.label}</span>}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

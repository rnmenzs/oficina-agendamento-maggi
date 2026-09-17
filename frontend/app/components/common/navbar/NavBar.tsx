import { Link } from "react-router";
import { LogOut } from "lucide-react";

import { NavBarLink } from "./NavBarLink";

export type NavBarSection = {
    to: string;
    label: string;
};

type NavBarProps = {
    home: string;
    sections: readonly NavBarSection[];
    onLogout?: () => void;
};

// As rotas vêm de fora: componente não conhece a URL do sistema, quem conhece é a rota que o monta.
export function NavBar({ home, sections, onLogout }: NavBarProps) {
    return (
        <header
            className="sticky z-10 border-b border-line bg-surface"
            style={{ top: "env(safe-area-inset-top, 0px)" }}
        >
            <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-7 px-5">
                <Link
                    to={home}
                    className="flex items-baseline gap-2 text-lg font-bold tracking-tight
                        text-ink no-underline"
                >
                    Maggi
                    <span className="text-xs font-normal tracking-widest text-muted uppercase">
                        Oficina
                    </span>
                </Link>

                <nav className="ml-auto flex items-center gap-1" aria-label="Seções">
                    {sections.map(section => (
                        <NavBarLink key={section.to} to={section.to}>{section.label}</NavBarLink>
                    ))}

                    {onLogout && (
                        <button
                            type="button"
                            onClick={onLogout}
                            className="ml-2 rounded-sm px-3 py-2 text-sm font-medium text-muted
                                transition-colors hover:bg-surface-alt hover:text-ink"
                            title="Sair"
                        >
                            <LogOut className="size-4" aria-hidden />
                            <span className="sr-only">Sair</span>
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
}

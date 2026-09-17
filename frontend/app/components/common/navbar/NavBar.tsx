import { LogOut } from "lucide-react";
import { Link } from "react-router";

import { ButtonIcon } from "../button/ButtonIcon";
import { Brand } from "./Brand";
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
// Sair também: a barra só avisa que clicaram, e quem encerra a sessão é quem a montou.
export function NavBar({ home, sections, onLogout }: NavBarProps) {
    return (
        <header
            className="sticky z-10 border-b border-line bg-surface"
            style={{ top: "env(safe-area-inset-top, 0px)" }}
        >
            <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-7 px-5">
                <Link to={home} className="no-underline">
                    <Brand />
                </Link>

                <nav className="ml-auto flex items-center gap-1" aria-label="Seções">
                    {sections.map(section => (
                        <NavBarLink key={section.to} to={section.to}>{section.label}</NavBarLink>
                    ))}

                    {onLogout && (
                        <span className="ml-2">
                            <ButtonIcon label="Sair" icon={LogOut} onClick={onLogout} />
                        </span>
                    )}
                </nav>
            </div>
        </header>
    );
}

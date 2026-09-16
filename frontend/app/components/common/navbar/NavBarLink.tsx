import type { ReactNode } from "react";
import { NavLink } from "react-router";

// NavLink e não Button: o estado ativo vem da URL, e ele marca aria-current sozinho.
export function NavBarLink({ to, children }: { to: string; children: ReactNode }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `rounded-sm px-3 py-2 text-sm font-medium no-underline transition-colors ${
                    isActive ? "bg-primary-soft text-ink" : "text-muted hover:bg-surface-alt hover:text-ink"
                }`}
        >
            {children}
        </NavLink>
    );
}

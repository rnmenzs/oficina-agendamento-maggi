import type { ReactNode } from "react";

// Sem padding: filtros e formulários põem o seu, e a tabela precisa ir de ponta a ponta.
// Sem recortar o que passa da borda, também: dentro do card há calendário e lista de seleção, e
// um `overflow-hidden` aqui cortaria os dois. Quem precisa de canto redondo arredonda o seu.
export function Card({ children }: { children: ReactNode }) {
    return (
        <div className="w-full rounded-card border border-line bg-surface shadow-card">
            {children}
        </div>
    );
}

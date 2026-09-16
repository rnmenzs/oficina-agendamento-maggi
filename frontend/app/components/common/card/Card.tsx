import type { ReactNode } from "react";

// Os cantos são recortados para a tabela encostar na borda sem estourar o arredondado. Sem padding:
// filtros e formulários põem o seu, e a tabela precisa ir de ponta a ponta.
export function Card({ children }: { children: ReactNode }) {
    return (
        <div className="w-full overflow-hidden rounded-card border border-line bg-surface shadow-card">
            {children}
        </div>
    );
}

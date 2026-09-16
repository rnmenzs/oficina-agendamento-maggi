import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "../button/Button";

type TablePaginationProps = {
    page: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
};

export function TablePagination({ page, pageSize, total, onChange }: TablePaginationProps) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, total);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p aria-live="polite" className="text-sm text-muted">
                {total === 0 ? "Nenhum resultado" : `${first}–${last} de ${total}`}
            </p>

            <div className="flex items-center gap-2">
                <Button variant="plain" disabled={page <= 1} onClick={() => onChange(page - 1)}>
                    <ChevronLeft size={16} aria-hidden />
                    Anterior
                </Button>

                <span className="px-1 text-sm whitespace-nowrap text-muted">
                    Página {page} de {pages}
                </span>

                <Button variant="plain" disabled={page >= pages} onClick={() => onChange(page + 1)}>
                    Próxima
                    <ChevronRight size={16} aria-hidden />
                </Button>
            </div>
        </div>
    );
}

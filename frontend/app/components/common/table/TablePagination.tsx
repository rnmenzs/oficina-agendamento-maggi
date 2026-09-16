import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "../button/Button";
import { FormSelect } from "../forms/FormSelect/FormSelect";

type TablePaginationProps = {
    page: number;
    pageSize: number;
    total: number;
    /** O que está sendo contado, para o total dizer "de 8 agendamentos" e não só "de 8". */
    unit?: string;
    pageSizes?: readonly number[];
    onChange: (page: number) => void;
    onPageSize?: (pageSize: number) => void;
};

export function TablePagination({
    page, pageSize, total, unit, pageSizes, onChange, onPageSize
}: TablePaginationProps) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, total);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2">
            <p aria-live="polite" className="text-sm text-muted">
                {total === 0
                    ? "Nenhum resultado"
                    : `${first}–${last} de ${total}${unit ? ` ${unit}` : ""}`}
            </p>

            <div className="flex flex-wrap items-center gap-2">
                {pageSizes && onPageSize && (
                    <div className="mr-2 flex items-center gap-2">
                        <span aria-hidden className="text-sm whitespace-nowrap text-muted">
                            Por página
                        </span>

                        <div className="w-18">
                            <FormSelect
                                label={`${unit ?? "Itens"} por página`}
                                hideLabel
                                options={pageSizes.map(size => ({
                                    value: String(size),
                                    label: String(size)
                                }))}
                                value={String(pageSize)}
                                onChange={chosen => onPageSize(Number(chosen))}
                            />
                        </div>
                    </div>
                )}

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

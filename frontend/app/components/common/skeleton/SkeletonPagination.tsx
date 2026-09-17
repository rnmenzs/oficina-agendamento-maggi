import { Skeleton } from "./Skeleton";

// A mesma altura e o mesmo lugar do rodapé de verdade: quando os dados chegam, nada pula.
export function SkeletonPagination() {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2">
            <Skeleton className="h-3 w-44" />

            <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-28" />
            </div>
        </div>
    );
}

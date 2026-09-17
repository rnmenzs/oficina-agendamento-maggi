import { DataList } from "../common/page/DataList";
import { Skeleton } from "../common/skeleton/Skeleton";

// Os rótulos são os de verdade e ficam no lugar: quando os dados chegam, só a cor muda.
const LABELS = ["Placa", "Veículo", "Cliente", "Telefone", "E-mail"];

/** O cartão da ficha enquanto o agendamento não chegou: barra de status, dados e histórico. */
export function AppointmentSkeleton() {
    return (
        <Skeleton label="Carregando" className="flex flex-col">
            <div className="flex flex-wrap items-center gap-3.5 border-b border-line px-5 py-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-6 w-24 rounded-full" />

                <div className="ml-auto flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-28" />
                </div>
            </div>

            <DataList
                entries={LABELS.map((label, at) => ({
                    label,
                    value: <Skeleton className={`mt-1 h-4 ${at % 2 ? "w-3/5" : "w-2/5"}`} />
                }))}
            />

            <section className="border-t border-line px-5 py-4">
                <h2 className="text-xs font-semibold tracking-widest text-muted uppercase">Histórico</h2>

                <div className="mt-3 flex flex-col gap-3 pl-6">
                    <Skeleton className="h-3 w-56" />
                    <Skeleton className="h-3 w-40" />
                </div>
            </section>
        </Skeleton>
    );
}

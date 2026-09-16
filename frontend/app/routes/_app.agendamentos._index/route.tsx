import { useNavigation } from "react-router";

import { AppointmentFilters } from "~/components/appointment/AppointmentFilters";
import { AppointmentTable } from "~/components/appointment/AppointmentTable";
import { Button } from "~/components/common/button/Button";
import { Card } from "~/components/common/card/Card";
import { PageHeader } from "~/components/common/page/PageHeader";
import { SkeletonTable } from "~/components/common/skeleton/SkeletonTable";
import { StateEmpty } from "~/components/common/state/StateEmpty";
import { StateError } from "~/components/common/state/StateError";
import { TablePagination } from "~/components/common/table/TablePagination";
import { PAGE_SIZES, readAppointmentFilter, useAppointmentFilter } from "~/hooks/useAppointmentFilter";
import { listar } from "~/services/ServiceAppointment";
import { SHORTCUTS, type PeriodShortcut } from "~/utils/period";
import type { Route } from "./+types/route";

// "Nenhum agendamento hoje" diz mais do que "neste período" — quando dá para dizer qual período.
function quando(atalho: PeriodShortcut | null): string {
    const rotulo = SHORTCUTS.find(({ value }) => value === atalho)?.label;

    return atalho === "tudo" || !rotulo ? "com esses filtros" : rotulo.toLowerCase();
}

export function meta() {
    return [{ title: "Agendamentos · Oficina Maggi" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
    const busca = new URL(request.url).searchParams;

    return { pagina: await listar(readAppointmentFilter(busca)) };
}

export function ErrorBoundary() {
    return (
        <Card>
            <StateError description="Não deu para carregar a agenda. Tente de novo em instantes.">
                <Button variant="primary" onClick={() => location.reload()}>Tentar de novo</Button>
            </StateError>
        </Card>
    );
}

export default function Agendamentos({ loaderData }: Route.ComponentProps) {
    const filtro = useAppointmentFilter();
    const navegacao = useNavigation();
    const { pagina } = loaderData;

    return (
        <>
            <PageHeader title="Agendamentos" subtitle={filtro.descricao}>
                <Button to="/agendamentos/novo" variant="primary">Novo agendamento</Button>
            </PageHeader>

            <Card>
                <AppointmentFilters
                    atalho={filtro.atalho}
                    periodo={filtro.periodo}
                    status={filtro.status}
                    padrao={filtro.padrao}
                    onAtalho={filtro.escolherAtalho}
                    onPeriodo={filtro.escolherPeriodo}
                    onStatus={filtro.escolherStatus}
                    onLimpar={filtro.limpar}
                />
            </Card>

            <Card>
                {navegacao.state === "loading"
                    ? <SkeletonTable columns={8} />
                    : pagina.total === 0
                        ? (
                            <StateEmpty
                                title={`Nenhum agendamento ${quando(filtro.atalho)}`}
                                description="Marque um serviço ou olhe outro período."
                            >
                                <Button onClick={() => filtro.escolherAtalho("semana")}>
                                    Ver a semana
                                </Button>
                                <Button to="/agendamentos/novo" variant="primary">Novo agendamento</Button>
                            </StateEmpty>
                        )
                        : (
                            <>
                                <AppointmentTable
                                    agendamentos={pagina.itens}
                                    linkTo={({ id }) => `/agendamentos/${id}`}
                                />
                                <TablePagination
                                    page={pagina.pagina}
                                    pageSize={pagina.tamanhoDaPagina}
                                    total={pagina.total}
                                    unit="agendamentos"
                                    pageSizes={PAGE_SIZES}
                                    onChange={filtro.escolherPagina}
                                    onPageSize={filtro.escolherTamanho}
                                />
                            </>
                        )}
            </Card>
        </>
    );
}

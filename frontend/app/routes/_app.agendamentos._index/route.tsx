import { Suspense } from "react";
import { Await, useLocation } from "react-router";

import { AppointmentFilters } from "~/components/appointment/AppointmentFilters";
import { AppointmentSummary } from "~/components/appointment/AppointmentSummary";
import { AppointmentTable } from "~/components/appointment/AppointmentTable";
import { Button } from "~/components/common/button/Button";
import { Card } from "~/components/common/card/Card";
import { PageHeader } from "~/components/common/page/PageHeader";
import { SkeletonPagination } from "~/components/common/skeleton/SkeletonPagination";
import { StateEmpty } from "~/components/common/state/StateEmpty";
import { StateError } from "~/components/common/state/StateError";
import { TablePagination } from "~/components/common/table/TablePagination";
import { PAGE_SIZES, readAppointmentFilter, useAppointmentFilter } from "~/hooks/useAppointmentFilter";
import { useStatusActions } from "~/hooks/useStatusActions";
import { list } from "~/services/ServiceAppointment";
import type { AppointmentResponse } from "~/types/TypeAppointment";
import { SHORTCUTS, type PeriodShortcut } from "~/utils/period";
import type { Route } from "./+types/route";

// "Nenhum agendamento hoje" diz mais do que "neste período" — quando dá para dizer qual período.
function when(shortcut: PeriodShortcut | null): string {
    const label = SHORTCUTS.find(({ value }) => value === shortcut)?.label;

    return shortcut === "tudo" || !label ? "com esses filtros" : label.toLowerCase();
}

export function meta() {
    return [{ title: "Agendamentos · Oficina Maggi" }];
}

// A promessa vai sem esperar: título, filtros e botões pintam na hora, e só a tabela aguarda a
// API. Esperar aqui deixava a tela inteira parada pelo tempo da chamada.
export function clientLoader({ request }: Route.ClientLoaderArgs) {
    const search = new URL(request.url).searchParams;

    return { page: list(readAppointmentFilter(search)) };
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

export default function Appointments({ loaderData }: Route.ComponentProps) {
    const filter = useAppointmentFilter();
    const { change, busy } = useStatusActions({
        summaryOf: appointment => <AppointmentSummary appointment={appointment} />
    });
    const location = useLocation();

    const linkTo = ({ id }: AppointmentResponse) => `/agendamentos/${id}`;

    return (
        <>
            <PageHeader title="Agendamentos" subtitle={filter.description}>
                <Button to="/agendamentos/novo" variant="primary">Novo agendamento</Button>
            </PageHeader>

            <Card>
                <AppointmentFilters
                    shortcut={filter.shortcut}
                    period={filter.period}
                    status={filter.status}
                    isDefault={filter.isDefault}
                    onShortcut={filter.chooseShortcut}
                    onPeriod={filter.choosePeriod}
                    onStatus={filter.chooseStatus}
                    onClear={filter.clear}
                />
            </Card>

            {/* A chave é a URL: mudar filtro ou página remonta a fronteira e o esqueleto aparece. Sem
                ela o React seguraria a tabela velha até a nova chegar — que é o que se quer numa
                releitura da mesma URL, depois de trocar um status, e não aqui. */}
            <Card>
                <Suspense
                    key={location.search}
                    fallback={
                        <>
                            <AppointmentTable appointments={[]} loading linkTo={linkTo} />
                            <SkeletonPagination />
                        </>
                    }
                >
                    <Await resolve={loaderData.page}>
                        {page => page.total === 0
                            ? (
                                <StateEmpty
                                    title={`Nenhum agendamento ${when(filter.shortcut)}`}
                                    description="Marque um serviço ou olhe outro período."
                                >
                                    <Button onClick={() => filter.chooseShortcut("semana")}>
                                        Ver a semana
                                    </Button>
                                    <Button to="/agendamentos/novo" variant="primary">Novo agendamento</Button>
                                </StateEmpty>
                            )
                            : (
                                <>
                                    <AppointmentTable
                                        appointments={page.itens}
                                        linkTo={linkTo}
                                        busy={busy}
                                        onAction={change}
                                    />
                                    <TablePagination
                                        page={page.pagina}
                                        pageSize={page.tamanhoDaPagina}
                                        total={page.total}
                                        unit="agendamentos"
                                        pageSizes={PAGE_SIZES}
                                        onChange={filter.choosePage}
                                        onPageSize={filter.choosePageSize}
                                    />
                                </>
                            )}
                    </Await>
                </Suspense>
            </Card>
        </>
    );
}

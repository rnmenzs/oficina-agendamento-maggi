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
import { useStatusActions } from "~/hooks/useStatusActions";
import { list } from "~/services/ServiceAppointment";
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

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
    const search = new URL(request.url).searchParams;

    return { page: await list(readAppointmentFilter(search)) };
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
    const { change, busy } = useStatusActions();
    const navigation = useNavigation();
    const { page } = loaderData;

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

            <Card>
                {navigation.state === "loading"
                    ? <SkeletonTable columns={8} />
                    : page.total === 0
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
                                    linkTo={({ id }) => `/agendamentos/${id}`}
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
            </Card>
        </>
    );
}

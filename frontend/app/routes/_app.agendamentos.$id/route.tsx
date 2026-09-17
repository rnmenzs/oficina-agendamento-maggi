import { Suspense } from "react";
import { Await, isRouteErrorResponse, Link, useRouteError } from "react-router";

import { AppointmentHistory } from "~/components/appointment/AppointmentHistory";
import { AppointmentPaths } from "~/components/appointment/AppointmentPaths";
import { AppointmentSkeleton } from "~/components/appointment/AppointmentSkeleton";
import { AppointmentStatusBar } from "~/components/appointment/AppointmentStatusBar";
import { AppointmentSummary } from "~/components/appointment/AppointmentSummary";
import { BadgePlate } from "~/components/common/badge/BadgePlate";
import { Button } from "~/components/common/button/Button";
import { Card } from "~/components/common/card/Card";
import { DataList } from "~/components/common/page/DataList";
import { PageBreadcrumb } from "~/components/common/page/PageBreadcrumb";
import { PageHeader } from "~/components/common/page/PageHeader";
import { Skeleton } from "~/components/common/skeleton/Skeleton";
import { StateEmpty } from "~/components/common/state/StateEmpty";
import { useStatusActions } from "~/hooks/useStatusActions";
import { ApiError } from "~/services/ServiceHttp";
import { get } from "~/services/ServiceAppointment";
import { dayOf, formatDay, formatDayLong, formatTime } from "~/utils/date";
import { formatPhone } from "~/utils/phone";
import { deferred } from "~/utils/promise";
import { SERVICE_LABEL } from "~/utils/service";
import type {
    AppointmentDetailResponse, AppointmentResponse, AppointmentStatus
} from "~/types/TypeAppointment";
import type { Route } from "./+types/route";

// O título da aba é genérico: o meta roda antes de o dado existir, e o agendamento vai como
// promessa para a tela pintar a moldura antes da API responder.
export function meta() {
    return [{ title: "Agendamento · Oficina Maggi" }];
}

export function clientLoader({ params }: Route.ClientLoaderArgs) {
    return { appointment: deferred(get(params.id)) };
}

// Um id que não existe é 404, não falha: a mensagem diz o que aconteceu com a página, e não que a
// aplicação quebrou.
export function ErrorBoundary() {
    const error = useRouteError();
    const notFound = (error instanceof ApiError && error.status === 404)
        || (isRouteErrorResponse(error) && error.status === 404);

    return (
        <Card>
            <StateEmpty
                label={notFound ? "Erro 404" : "Erro"}
                title={notFound ? "Agendamento não encontrado" : "Não deu para abrir o agendamento"}
                description={notFound
                    ? "Ele pode ter sido removido, ou o endereço está errado."
                    : "Tente de novo em instantes."}
            >
                <Button to="/agendamentos" variant="primary">Ir para a agenda</Button>
            </StateEmpty>
        </Card>
    );
}

export default function Appointment({ loaderData }: Route.ComponentProps) {
    const { change, busy } = useStatusActions({
        summaryOf: current => <AppointmentSummary appointment={current} />
    });

    return (
        <Suspense fallback={<Waiting />}>
            <Await resolve={loaderData.appointment}>
                {appointment => <Detail appointment={appointment} busy={busy} onAction={change} />}
            </Await>
        </Suspense>
    );
}

// A mesma moldura da ficha, em cinza: trilha, título e cartão têm o mesmo tamanho do que vem.
function Waiting() {
    return (
        <>
            <PageBreadcrumb
                trail={[
                    { label: "Agendamentos", to: "/agendamentos" },
                    { label: <Skeleton as="span" className="h-3 w-24" /> }
                ]}
            />

            <PageHeader
                title={<Skeleton as="span" className="h-7 w-40" />}
                subtitle={<Skeleton as="span" className="h-3 w-64" />}
            />

            <Card><AppointmentSkeleton /></Card>
        </>
    );
}

type DetailProps = {
    appointment: AppointmentDetailResponse;
    busy: boolean;
    onAction: (appointment: AppointmentResponse, to: AppointmentStatus) => void;
};

function Detail({ appointment, busy, onAction }: DetailProps) {
    const day = dayOf(appointment.inicio);

    return (
        <>
            <PageBreadcrumb
                trail={[
                    { label: "Agendamentos", to: "/agendamentos" },
                    { label: `${formatDay(day)}, ${formatTime(appointment.inicio)}` }
                ]}
            />

            <PageHeader
                title={SERVICE_LABEL[appointment.tipoServico]}
                subtitle={formatDayLong(day)}
            />

            <Card>
                <AppointmentStatusBar appointment={appointment} busy={busy} onAction={onAction} />

                <DataList
                    entries={[
                        { label: "Placa", value: <BadgePlate plate={appointment.placa} /> },
                        {
                            label: "Veículo",
                            value: <>{appointment.modelo} <span className="text-muted">{appointment.ano}</span></>
                        },
                        {
                            label: "Cliente",
                            value: (
                                <Link
                                    to={`/clientes/${appointment.clienteId}`}
                                    className="text-primary no-underline hover:underline"
                                >
                                    {appointment.nomeDoCliente}
                                </Link>
                            )
                        },
                        { label: "Telefone", value: formatPhone(appointment.telefoneDoCliente) },
                        { label: "E-mail", value: appointment.emailDoCliente }
                    ]}
                />

                <AppointmentHistory appointment={appointment} />
            </Card>

            <AppointmentPaths status={appointment.status} />
        </>
    );
}

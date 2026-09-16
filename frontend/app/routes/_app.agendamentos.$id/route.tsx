import { isRouteErrorResponse, Link, useRouteError } from "react-router";

import { AppointmentHistory } from "~/components/appointment/AppointmentHistory";
import { AppointmentPaths } from "~/components/appointment/AppointmentPaths";
import { AppointmentStatusBar } from "~/components/appointment/AppointmentStatusBar";
import { AppointmentSummary } from "~/components/appointment/AppointmentSummary";
import { BadgePlate } from "~/components/common/badge/BadgePlate";
import { Button } from "~/components/common/button/Button";
import { Card } from "~/components/common/card/Card";
import { DataList } from "~/components/common/page/DataList";
import { PageBreadcrumb } from "~/components/common/page/PageBreadcrumb";
import { PageHeader } from "~/components/common/page/PageHeader";
import { StateEmpty } from "~/components/common/state/StateEmpty";
import { useStatusActions } from "~/hooks/useStatusActions";
import { ApiError } from "~/services/ServiceHttp";
import { get } from "~/services/ServiceAppointment";
import { dayOf, formatDay, formatDayLong, formatTime } from "~/utils/date";
import { formatPhone } from "~/utils/phone";
import { SERVICE_LABEL } from "~/utils/service";
import type { Route } from "./+types/route";

export function meta({ data }: Route.MetaArgs) {
    const appointment = data?.appointment;

    return [{
        title: appointment
            ? `${SERVICE_LABEL[appointment.tipoServico]} de ${appointment.nomeDoCliente} · Oficina Maggi`
            : "Agendamento · Oficina Maggi"
    }];
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
    return { appointment: await get(params.id) };
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
    const { appointment } = loaderData;
    const { change, busy } = useStatusActions({
        summaryOf: current => <AppointmentSummary appointment={current} />
    });

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
                <AppointmentStatusBar appointment={appointment} busy={busy} onAction={change} />

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

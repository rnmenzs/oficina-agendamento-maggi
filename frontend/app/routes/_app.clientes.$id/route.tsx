import { isRouteErrorResponse, useRevalidator, useRouteError, useSearchParams } from "react-router";

import { ClientAppointmentTable } from "~/components/client/ClientAppointmentTable";
import { ClientVehicleTable } from "~/components/client/ClientVehicleTable";
import { VehicleForm, VEHICLE_FIELDS, type VehicleFieldErrors } from "~/components/client/VehicleForm";
import { Button } from "~/components/common/button/Button";
import { Card } from "~/components/common/card/Card";
import { DataList } from "~/components/common/page/DataList";
import { PageBreadcrumb } from "~/components/common/page/PageBreadcrumb";
import { PageHeader } from "~/components/common/page/PageHeader";
import { StateEmpty } from "~/components/common/state/StateEmpty";
import { TablePagination } from "~/components/common/table/TablePagination";
import { useModal } from "~/hooks/useModal";
import { useNotification } from "~/hooks/useNotification";
import { useState } from "react";
import { listOfClient as appointmentsOf } from "~/services/ServiceAppointment";
import { get } from "~/services/ServiceClient";
import { ApiError } from "~/services/ServiceHttp";
import { create as createVehicle, listOfClient as vehiclesOf } from "~/services/ServiceVehicle";
import type { ClientResponse } from "~/types/TypeClient";
import type { CreateVehicleRequest, VehicleResponse } from "~/types/TypeVehicle";
import { dayOf, formatDay } from "~/utils/date";
import { fieldErrorOf } from "~/utils/fieldError";
import { formatPhone } from "~/utils/phone";
import type { Route } from "./+types/route";

const PAGE_SIZE = 10;

const SECTION = "text-xs font-semibold tracking-widest text-muted uppercase";

export function meta({ data }: Route.MetaArgs) {
    return [{ title: data ? `${data.client.nome} · Oficina Maggi` : "Cliente · Oficina Maggi" }];
}

export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
    // Página adulterada não quebra a tela: número inválido volta a ser a primeira, e a API corrige
    // o que passar do fim.
    const page = Math.max(1, Number(new URL(request.url).searchParams.get("pagina")) || 1);

    // As três chamadas são independentes, então saem juntas: em série, a tela esperaria a soma.
    const [client, vehicles, appointments] = await Promise.all([
        get(params.id),
        vehiclesOf(params.id),
        appointmentsOf(params.id, page, PAGE_SIZE)
    ]);

    return { client, vehicles, appointments, page };
}

export function ErrorBoundary() {
    const error = useRouteError();
    const notFound = (error instanceof ApiError && error.status === 404)
        || (isRouteErrorResponse(error) && error.status === 404);

    return (
        <Card>
            <StateEmpty
                label={notFound ? "Erro 404" : "Erro"}
                title={notFound ? "Cliente não encontrado" : "Não deu para abrir o cliente"}
                description={notFound
                    ? "Ele pode ter sido removido, ou o endereço está errado."
                    : "Tente de novo em instantes."}
            >
                <Button to="/clientes" variant="primary">Ver todos os clientes</Button>
            </StateEmpty>
        </Card>
    );
}

export default function Client({ loaderData }: Route.ComponentProps) {
    const { client, vehicles, appointments, page } = loaderData;
    const [search, setSearch] = useSearchParams();
    const { open } = useModal();
    const { notify } = useNotification();
    const revalidator = useRevalidator();

    // Cadastrar veículo não muda de tela: o que mudou está logo abaixo, e é só relê-lo.
    async function addVehicle() {
        const created = await open<VehicleResponse>(
            close => <VehicleCreation client={client} onDone={close} />,
            { width: "medium" }
        );

        if (!created) return;

        notify(`${created.modelo} cadastrado para ${client.nome}.`);
        revalidator.revalidate();
    }

    // A página vive na URL, como na agenda: recarregar, voltar e compartilhar o endereço caem no
    // mesmo lugar. A primeira não aparece, que é o normal.
    function goToPage(next: number) {
        const params = new URLSearchParams(search);

        if (next > 1) params.set("pagina", String(next)); else params.delete("pagina");

        setSearch(params, { preventScrollReset: true });
    }

    return (
        <>
            <PageBreadcrumb trail={[{ label: "Clientes", to: "/clientes" }, { label: client.nome }]} />

            <PageHeader
                title={client.nome}
                subtitle={`Cliente desde ${formatDay(dayOf(client.criadoEm))}`}
            >
                <Button onClick={addVehicle}>Adicionar veículo</Button>
                <Button to={`/agendamentos/novo?cliente=${client.id}`} variant="primary">
                    Novo agendamento
                </Button>
            </PageHeader>

            <Card>
                <DataList
                    entries={[
                        {
                            label: "Telefone",
                            value: <span className="font-mono">{formatPhone(client.telefone)}</span>
                        },
                        { label: "E-mail", value: client.email },
                        { label: "Veículos", value: <span className="font-mono">{vehicles.length}</span> },
                        {
                            label: "Agendamentos",
                            value: <span className="font-mono">{appointments.total}</span>
                        }
                    ]}
                />
            </Card>

            <h2 className={SECTION}>Veículos</h2>

            <Card>
                {vehicles.length
                    ? <ClientVehicleTable vehicles={vehicles} />
                    : (
                        <StateEmpty
                            title="Nenhum veículo cadastrado"
                            description="Sem veículo não há o que agendar. Cadastre o primeiro."
                        >
                            <Button variant="primary" onClick={addVehicle}>Adicionar veículo</Button>
                        </StateEmpty>
                    )}
            </Card>

            <h2 className={SECTION}>Agendamentos</h2>

            <Card>
                {appointments.total
                    ? (
                        <>
                            <ClientAppointmentTable
                                appointments={appointments.itens}
                                linkTo={appointment => `/agendamentos/${appointment.id}`}
                            />

                            <TablePagination
                                page={page}
                                pageSize={PAGE_SIZE}
                                total={appointments.total}
                                unit="agendamentos"
                                controls={appointments.totalDePaginas > 1}
                                onChange={goToPage}
                            />
                        </>
                    )
                    : (
                        <StateEmpty
                            title="Nenhum agendamento ainda"
                            description="Quando este cliente marcar um serviço, ele aparece aqui."
                        >
                            <Button to={`/agendamentos/novo?cliente=${client.id}`} variant="primary">
                                Novo agendamento
                            </Button>
                        </StateEmpty>
                    )}
            </Card>
        </>
    );
}

// O envio vive aqui dentro para a janela poder mostrar a recusa da API sem fechar: quem fecha é a
// resposta boa, e é ela que a promessa devolve.
function VehicleCreation({
    client, onDone
}: { client: ClientResponse; onDone: (vehicle?: VehicleResponse) => void }) {
    const { notify } = useNotification();
    const [sending, setSending] = useState(false);
    const [errors, setErrors] = useState<VehicleFieldErrors>({});

    async function submit(vehicle: CreateVehicleRequest) {
        setSending(true);
        setErrors({});

        try {
            onDone(await createVehicle(client.id, vehicle));
        } catch (failure) {
            setSending(false);

            const message = failure instanceof ApiError
                ? failure.message
                : "Não foi possível cadastrar o veículo.";

            // Recusa de campo volta para o campo; o que não é de campo nenhum vira aviso.
            const field = fieldErrorOf(message, VEHICLE_FIELDS);

            if (field) setErrors(field); else notify(message, "error");
        }
    }

    return (
        <VehicleForm
            clientName={client.nome}
            errors={errors}
            sending={sending}
            onCancel={() => onDone()}
            onSubmit={submit}
        />
    );
}

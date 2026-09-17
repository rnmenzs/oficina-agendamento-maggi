import { Suspense, useEffect } from "react";
import {
    Await, isRouteErrorResponse, useFetcher, useLocation, useRouteError, useSearchParams
} from "react-router";

import { ClientAppointmentTable } from "~/components/client/ClientAppointmentTable";
import { ClientVehicleTable } from "~/components/client/ClientVehicleTable";
import { VehicleForm, VEHICLE_FIELDS, type VehicleFieldErrors } from "~/components/client/VehicleForm";
import { Button } from "~/components/common/button/Button";
import { Card } from "~/components/common/card/Card";
import { DataList } from "~/components/common/page/DataList";
import { PageBreadcrumb } from "~/components/common/page/PageBreadcrumb";
import { PageHeader } from "~/components/common/page/PageHeader";
import { Skeleton } from "~/components/common/skeleton/Skeleton";
import { SkeletonPagination } from "~/components/common/skeleton/SkeletonPagination";
import { StateEmpty } from "~/components/common/state/StateEmpty";
import { TablePagination } from "~/components/common/table/TablePagination";
import { useModal } from "~/hooks/useModal";
import { useNotification } from "~/hooks/useNotification";
import { useResolved } from "~/hooks/useResolved";
import { listOfClient as appointmentsOf } from "~/services/ServiceAppointment";
import { get } from "~/services/ServiceClient";
import { ApiError } from "~/services/ServiceHttp";
import { create as createVehicle, listOfClient as vehiclesOf } from "~/services/ServiceVehicle";
import type { AppointmentResponse } from "~/types/TypeAppointment";
import type { ClientResponse } from "~/types/TypeClient";
import type { SubmitResult } from "~/types/TypeError";
import type { CreateVehicleRequest, VehicleResponse } from "~/types/TypeVehicle";
import { dayOf, formatDay } from "~/utils/date";
import { fieldOf } from "~/utils/fieldError";
import { formatPhone } from "~/utils/phone";
import { deferred } from "~/utils/promise";
import { unlessRefused } from "~/utils/revalidate";
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

    // As três chamadas saem juntas, mas só o cliente é esperado: sem ele não há nem título — e um
    // id que não existe tem que cair no 404 antes de qualquer coisa pintar. Veículos e histórico
    // vão como promessa, e cada bloco da tela aguarda o seu.
    const vehicles = deferred(vehiclesOf(params.id));
    const appointments = deferred(appointmentsOf(params.id, page, PAGE_SIZE));
    const client = await get(params.id);

    return { client, vehicles, appointments, page };
}

// O veículo entra por aqui: a rota fala com o service, e a ficha é relida sozinha depois de
// gravar — é o que faz o carro novo aparecer na frota sem ninguém pedir.
export async function clientAction({ params, request }: Route.ClientActionArgs): Promise<SubmitResult<VehicleResponse>> {
    const vehicle: CreateVehicleRequest = await request.json();

    try {
        return { saved: await createVehicle(params.id, vehicle) };
    } catch (error) {
        const message = error instanceof ApiError ? error.message : "Não foi possível cadastrar o veículo.";

        return { failure: { message, field: fieldOf(message, VEHICLE_FIELDS) ?? undefined } };
    }
}

export const shouldRevalidate = unlessRefused;

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
    const location = useLocation();
    const { open } = useModal();
    const { notify } = useNotification();

    const linkTo = (appointment: AppointmentResponse) => `/agendamentos/${appointment.id}`;

    // Ao paginar, a frota e as contagens recebem promessas novas mas não têm por que piscar: ficam
    // com o que tinham até a resposta chegar. Só o histórico suspende — e só ele vira esqueleto.
    const fleet = useResolved(vehicles);
    const known = useResolved(appointments);

    // Cadastrar veículo não muda de tela: o que mudou está logo abaixo, e a rota é relida sozinha
    // depois do clientAction gravar.
    async function addVehicle() {
        const created = await open<VehicleResponse>(
            close => <VehicleCreation client={client} onDone={close} />,
            { width: "medium" }
        );

        if (created) notify(`${created.modelo} cadastrado para ${client.nome}.`);
    }

    // A página vive na URL, como na agenda: recarregar, voltar e compartilhar o endereço caem no
    // mesmo lugar. A primeira não aparece, que é o normal.
    function goToPage(next: number) {
        const params = new URLSearchParams(search);

        if (next > 1) params.set("pagina", String(next)); else params.delete("pagina");

        setSearch(params, { preventScrollReset: true });
    }

    // Um número pequeno esperando: a barra tem o tamanho do número, para o nome ao lado não pular.
    const counting = <Skeleton className="mt-1 h-4 w-6" />;

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
                        {
                            label: "Veículos",
                            value: fleet ? <span className="font-mono">{fleet.length}</span> : counting
                        },
                        {
                            label: "Agendamentos",
                            value: known ? <span className="font-mono">{known.total}</span> : counting
                        }
                    ]}
                />
            </Card>

            <h2 className={SECTION}>Veículos</h2>

            <Card>
                {!fleet
                    ? <ClientVehicleTable vehicles={[]} loading />
                    : fleet.length
                        ? <ClientVehicleTable vehicles={fleet} />
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

            {/* A chave é a URL: mudar de página remonta a fronteira e o esqueleto aparece. Reler a
                mesma URL depois de cadastrar um veículo não remonta, e a tabela fica até a nova chegar. */}
            <Card>
                <Suspense
                    key={location.search}
                    fallback={
                        <>
                            <ClientAppointmentTable appointments={[]} loading linkTo={linkTo} />
                            <SkeletonPagination />
                        </>
                    }
                >
                    <Await resolve={appointments}>
                        {history => history.total
                            ? (
                                <>
                                    <ClientAppointmentTable appointments={history.itens} linkTo={linkTo} />

                                    <TablePagination
                                        page={page}
                                        pageSize={PAGE_SIZE}
                                        total={history.total}
                                        unit="agendamentos"
                                        controls={history.totalDePaginas > 1}
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
                    </Await>
                </Suspense>
            </Card>
        </>
    );
}

// O envio vive aqui dentro para a janela poder mostrar a recusa da API sem fechar: quem fecha é a
// resposta boa, e é ela que a promessa devolve.
// A `action` é explícita pelo mesmo motivo da lista de clientes: a janela vive na raiz, fora da
// árvore desta rota, e sem ela o fetcher submeteria para "/".
function VehicleCreation({
    client, onDone
}: { client: ClientResponse; onDone: (vehicle?: VehicleResponse) => void }) {
    const fetcher = useFetcher<typeof clientAction>();
    const { notify } = useNotification();
    const result = fetcher.data;
    const failure = result && "failure" in result ? result.failure : null;
    const errors: VehicleFieldErrors = failure?.field ? { [failure.field]: failure.message } : {};

    useEffect(() => {
        if (!result) return;

        if ("saved" in result) onDone(result.saved);
        else if (!result.failure.field) notify(result.failure.message, "error");
    }, [result, onDone, notify]);

    return (
        <VehicleForm
            clientName={client.nome}
            errors={errors}
            sending={fetcher.state !== "idle"}
            onCancel={() => onDone()}
            onSubmit={vehicle => fetcher.submit(vehicle, {
                method: "post", action: `/clientes/${client.id}`, encType: "application/json"
            })}
        />
    );
}

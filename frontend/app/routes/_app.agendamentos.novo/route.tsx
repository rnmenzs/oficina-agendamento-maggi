import { useEffect } from "react";
import { Form, useNavigate, useSearchParams, type ShouldRevalidateFunctionArgs } from "react-router";

import { AppointmentSlots, AppointmentSlotsSkeleton } from "~/components/appointment/AppointmentSlots";
import { Button } from "~/components/common/button/Button";
import { Card } from "~/components/common/card/Card";
import { StateError } from "~/components/common/state/StateError";
import { FormDate } from "~/components/common/forms/FormDate/FormDate";
import { FormSearch } from "~/components/common/forms/FormSearch/FormSearch";
import { FormSelect } from "~/components/common/forms/FormSelect/FormSelect";
import { FormSkeleton } from "~/components/common/forms/FormSkeleton";
import { PageBreadcrumb } from "~/components/common/page/PageBreadcrumb";
import { PageHeader } from "~/components/common/page/PageHeader";
import { useNotification } from "~/hooks/useNotification";
import { useResolved } from "~/hooks/useResolved";
import { create, occupyingOn } from "~/services/ServiceAppointment";
import { list as listClients } from "~/services/ServiceClient";
import { listOfClient } from "~/services/ServiceVehicle";
import { ApiError } from "~/services/ServiceHttp";
import type { ServiceType } from "~/types/TypeAppointment";
import { dayOf, formatDayLong, formatTime, instantOf, isDay, today } from "~/utils/date";
import { formatPhone } from "~/utils/phone";
import { formatPlate } from "~/utils/plate";
import { isServiceType, SERVICE_LABEL, SERVICE_MINUTES, SERVICE_TYPES } from "~/utils/service";
import { isOpen, nextOpenDay, slotsOfDay } from "~/utils/schedule";
import type { Route } from "./+types/route";

const SERVICE_OPTIONS = SERVICE_TYPES.map(type => ({
    value: type,
    label: `${SERVICE_LABEL[type]} · ${SERVICE_MINUTES[type]} min`
}));

export function meta() {
    return [{ title: "Novo agendamento · Oficina Maggi" }];
}

// Some da lista quem já não existe; qualquer outra falha continua subindo para o ErrorBoundary.
const missing = (error: unknown) => {
    if (error instanceof ApiError && error.status === 404) return [];

    throw error;
};

// O formulário mora na URL como o filtro da agenda: trocar cliente, serviço ou dia é o que traz
// os veículos e a ocupação daquele dia, e recarregar não perde o que já foi preenchido.
// As três buscas vão como promessa: o formulário pinta na hora, e cada campo espera só a sua.
export function clientLoader({ request }: Route.ClientLoaderArgs) {
    const search = new URL(request.url).searchParams;
    const clientId = search.get("cliente") ?? "";

    // Os dois vêm da URL: dia torto e cliente que não existe mais são endereço velho, não defeito.
    // Sem esta guarda a tela cai no erro, e o "Tentar de novo" recarregaria no mesmo erro.
    const day = isDay(search.get("dia")) ? search.get("dia")! : nextOpenDay();

    return {
        clients: listClients(),
        vehicles: clientId ? listOfClient(clientId).catch(missing) : Promise.resolve([]),
        appointments: isOpen(day) ? occupyingOn(day) : Promise.resolve([]),
        day
    };
}

// Trocar serviço ou horário não muda nada do lado do servidor: as faixas são calculadas aqui, com
// os agendamentos que já vieram. Sem isto, cada clique num horário rebuscaria a lista de clientes
// inteira — que a API ainda devolve sem paginar.
export function shouldRevalidate(
    { currentUrl, nextUrl, formMethod, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs
) {
    if (formMethod) return defaultShouldRevalidate;

    const changed = (key: string) => currentUrl.searchParams.get(key) !== nextUrl.searchParams.get(key);

    return changed("cliente") || changed("dia");
}

// Sem isto, uma falha ao buscar clientes sobe até a raiz e a pessoa perde o que já preencheu.
export function ErrorBoundary() {
    return (
        <Card>
            <StateError description="Não deu para abrir o formulário. Tente de novo em instantes.">
                <Button variant="primary" onClick={() => location.reload()}>Tentar de novo</Button>
            </StateError>
        </Card>
    );
}

// A recusa da API vira o aviso do formulário: as regras de negócio são dela, e a frase que ela
// devolve já está escrita para quem lê.
export async function clientAction({ request }: Route.ClientActionArgs) {
    const form = await request.formData();

    const vehicleId = String(form.get("veiculoId") ?? "");
    const time = String(form.get("hora") ?? "");
    const service = String(form.get("tipoServico") ?? "");
    const day = String(form.get("dia") ?? "");

    // Os campos vêm de fora, e o botão desabilitado não é guarda de nada. Sem isto, hora vazia vira
    // data inválida e serviço adulterado vira duração indefinida — os dois com mensagem errada.
    if (!vehicleId || !time || !isDay(day) || !isServiceType(service)) {
        return { created: null, error: "Confira o veículo, o serviço e o horário antes de agendar." };
    }

    try {
        const created = await create({
            veiculoId: vehicleId,
            tipoServico: service,
            inicio: instantOf(day, time)
        });

        return { created, error: null };
    } catch (error) {
        return {
            created: null,
            error: error instanceof ApiError ? error.message : "Não foi possível agendar."
        };
    }
}

export default function NewAppointment({ loaderData, actionData }: Route.ComponentProps) {
    const { day } = loaderData;
    const [search, setSearch] = useSearchParams();
    const { notify } = useNotification();
    const navigate = useNavigate();

    const clientId = search.get("cliente") ?? "";
    const vehicleId = search.get("veiculo") ?? "";
    const time = search.get("hora") ?? "";
    const chosen = search.get("servico");
    const service = isServiceType(chosen) ? chosen : "TrocaOleo";

    // Trocar cliente ou dia rebusca as três listas, mas só a que mudou de assunto espera de novo:
    // a frota é do cliente, a ocupação é do dia, e a lista de clientes é sempre a mesma — fica a
    // que está até a nova chegar. Só na primeira vez cada campo espera.
    const clients = useResolved(loaderData.clients);
    const fleet = useResolved(loaderData.vehicles, clientId);
    const occupying = useResolved(loaderData.appointments, day);
    const slots = occupying && slotsOfDay(day, service, vehicleId, occupying);

    function change(fields: Record<string, string>) {
        const next = new URLSearchParams(search);

        for (const [key, value] of Object.entries(fields)) {
            if (value) next.set(key, value); else next.delete(key);
        }

        setSearch(next, { replace: true, preventScrollReset: true });
    }

    // Criado: avisa e leva para a ficha. O aviso vive num contexto acima da rota, então ele
    // sobrevive à troca de tela — é por isso que dá para avisar antes de navegar.
    useEffect(() => {
        // Recusado: o aviso conta o porquê e a tela fica como está, com as escolhas preservadas.
        if (actionData?.error) {
            notify(actionData.error, "error");
            return;
        }

        if (!actionData?.created) return;

        // O que foi salvo vem do que a API devolveu, e não do que está na URL agora: mexer nos
        // campos enquanto o envio corre faria o aviso anunciar um horário que não foi gravado.
        const saved = actionData.created;

        notify(
            `${formatPlate(saved.placa)} agendado para ${formatDayLong(dayOf(saved.inicio))}, `
            + `${formatTime(saved.inicio)}.`
        );

        navigate(`/agendamentos/${saved.id}`);
    }, [actionData, notify, navigate]);

    return (
        <>
            <PageBreadcrumb
                trail={[{ label: "Agendamentos", to: "/agendamentos" }, { label: "Novo" }]}
            />

            <PageHeader title="Novo agendamento" subtitle="Escolha o veículo, o horário e o serviço." />

            <Card>
                <Form method="post" className="flex flex-col gap-5 p-5">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {clients
                            ? (
                                <FormSearch
                                    label="Cliente"
                                    placeholder="Buscar por nome, e-mail ou telefone"
                                    emptyLabel="Nenhum cliente com esse termo"
                                    options={clients.map(client => ({
                                        value: client.id,
                                        label: client.nome,
                                        detail: formatPhone(client.telefone),
                                        terms: [client.email, client.telefone]
                                    }))}
                                    defaultValue={clientId}
                                    onChange={value => change({ cliente: value, veiculo: "", hora: "" })}
                                />
                            )
                            : <FormSkeleton label="Cliente" />}

                        {fleet
                            ? (
                                <FormSelect
                                    label="Veículo"
                                    name="veiculoId"
                                    options={fleet.map(vehicle => ({
                                        value: vehicle.id,
                                        label: `${formatPlate(vehicle.placa)} · ${vehicle.modelo} ${vehicle.ano}`
                                    }))}
                                    value={vehicleId}
                                    placeholder={fleet.length ? "Escolher veículo" : "Escolha o cliente primeiro"}
                                    disabled={fleet.length === 0}
                                    hint={clientId && fleet.length === 0
                                        ? "Este cliente não tem veículo cadastrado."
                                        : undefined}
                                    onChange={value => change({ veiculo: value, hora: "" })}
                                />
                            )
                            : <FormSkeleton label="Veículo" />}

                        <FormSelect
                            label="Serviço"
                            name="tipoServico"
                            options={SERVICE_OPTIONS}
                            value={service}
                            hint="A duração define quais horários cabem no dia."
                            onChange={value => change({ servico: value, hora: "" })}
                        />

                        <FormDate
                            label="Data"
                            name="dia"
                            value={day}
                            min={today()}
                            onChange={value => change({ dia: value, hora: "" })}
                        />
                    </div>

                    <fieldset className="flex flex-col gap-2 border-0 p-0">
                        <legend className="text-xs font-semibold tracking-wider text-muted uppercase">
                            Horário
                        </legend>

                        {!slots
                            ? <AppointmentSlotsSkeleton />
                            : slots.length === 0
                                ? (
                                    <p className="text-sm text-muted">
                                        A oficina não atende em {formatDayLong(day)}.
                                    </p>
                                )
                                : (
                                    <AppointmentSlots
                                        slots={slots}
                                        value={time}
                                        onChange={value => change({ hora: value })}
                                    />
                                )}
                    </fieldset>

                    <input type="hidden" name="hora" value={time} />

                    <div className="flex flex-wrap justify-end gap-2">
                        <Button to="/agendamentos">Voltar</Button>
                        <Button type="submit" variant="primary" disabled={!vehicleId || !time}>
                            Agendar
                        </Button>
                    </div>
                </Form>
            </Card>
        </>
    );
}

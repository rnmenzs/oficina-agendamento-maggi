import { useEffect, useState } from "react";
import { Form, useNavigate, useSearchParams, type ShouldRevalidateFunctionArgs } from "react-router";

import { AppointmentSlots } from "~/components/appointment/AppointmentSlots";
import { Button } from "~/components/common/button/Button";
import { Card } from "~/components/common/card/Card";
import { StateError } from "~/components/common/state/StateError";
import { FormDate } from "~/components/common/forms/FormDate/FormDate";
import { FormSearch } from "~/components/common/forms/FormSearch/FormSearch";
import { FormSelect } from "~/components/common/forms/FormSelect/FormSelect";
import { Notification } from "~/components/common/notification/Notification";
import { PageBreadcrumb } from "~/components/common/page/PageBreadcrumb";
import { PageHeader } from "~/components/common/page/PageHeader";
import { useNotification } from "~/hooks/useNotification";
import { create, occupyingOn } from "~/services/ServiceAppointment";
import { list as listClients } from "~/services/ServiceClient";
import { listOfClient } from "~/services/ServiceVehicle";
import { ApiError } from "~/services/ServiceHttp";
import type { ServiceType } from "~/types/TypeAppointment";
import { dayOf, formatDayLong, formatTime, instantOf, isDay, today } from "~/utils/date";
import { formatPhone } from "~/utils/phone";
import { formatPlate } from "~/utils/plate";
import { SERVICE_LABEL, SERVICE_MINUTES, SERVICE_TYPES } from "~/utils/service";
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
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
    const search = new URL(request.url).searchParams;
    const clientId = search.get("cliente") ?? "";

    // Os dois vêm da URL: dia torto e cliente que não existe mais são endereço velho, não defeito.
    // Sem esta guarda a tela cai no erro, e o "Tentar de novo" recarregaria no mesmo erro.
    const day = isDay(search.get("dia")) ? search.get("dia")! : nextOpenDay();

    const [clients, vehicles, appointments] = await Promise.all([
        listClients(),
        clientId ? listOfClient(clientId).catch(missing) : [],
        isOpen(day) ? occupyingOn(day) : []
    ]);

    return { clients, vehicles, day, appointments };
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

    // O botão fica desabilitado sem os dois, mas envio é dado de fora: sem esta guarda, hora vazia
    // vira data inválida e a pessoa recebe "não foi possível agendar" em vez do que falta.
    if (!vehicleId || !time) {
        return { created: null, error: "Escolha o veículo e o horário antes de agendar." };
    }

    try {
        const created = await create({
            veiculoId: vehicleId,
            tipoServico: String(form.get("tipoServico") ?? "") as ServiceType,
            inicio: instantOf(String(form.get("dia") ?? ""), time)
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
    const { clients, vehicles, day, appointments } = loaderData;
    const [search, setSearch] = useSearchParams();
    const { notify } = useNotification();
    const navigate = useNavigate();

    // O aviso da recusa some quando a pessoa fecha; sem isto o × da caixa não faria nada.
    const [noticeOpen, setNoticeOpen] = useState(true);
    const vehicleId = search.get("veiculo") ?? "";
    const time = search.get("hora") ?? "";
    const service = (search.get("servico") ?? "TrocaOleo") as ServiceType;
    const slots = slotsOfDay(day, service, vehicleId, appointments);

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
        setNoticeOpen(true);
    }, [actionData]);

    useEffect(() => {
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
                        <FormSearch
                            label="Cliente"
                            placeholder="Buscar por nome, e-mail ou telefone"
                            emptyLabel="Nenhum cliente com esse termo"
                            options={clients.map(client => ({
                                value: client.id,
                                label: client.nome,
                                detail: formatPhone(client.telefone)
                            }))}
                            defaultValue={search.get("cliente") ?? ""}
                            onChange={value => change({ cliente: value, veiculo: "", hora: "" })}
                        />

                        <FormSelect
                            label="Veículo"
                            name="veiculoId"
                            options={vehicles.map(vehicle => ({
                                value: vehicle.id,
                                label: `${formatPlate(vehicle.placa)} · ${vehicle.modelo} ${vehicle.ano}`
                            }))}
                            value={vehicleId}
                            placeholder={vehicles.length ? "Escolher veículo" : "Escolha o cliente primeiro"}
                            disabled={vehicles.length === 0}
                            hint={search.get("cliente") && vehicles.length === 0
                                ? "Este cliente não tem veículo cadastrado."
                                : undefined}
                            onChange={value => change({ veiculo: value, hora: "" })}
                        />

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

                        {slots.length === 0
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

                    {actionData?.error && noticeOpen && (
                        <Notification tone="error" onClose={() => setNoticeOpen(false)}>
                            {actionData.error}
                        </Notification>
                    )}

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

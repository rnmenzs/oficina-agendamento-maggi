import { Search } from "lucide-react";
import { Suspense, useEffect } from "react";
import { Await, useFetcher, useNavigate, useSearchParams, type ShouldRevalidateFunctionArgs } from "react-router";

import { ClientForm, CLIENT_FIELDS, type ClientFieldErrors } from "~/components/client/ClientForm";
import { ClientTable } from "~/components/client/ClientTable";
import { Button } from "~/components/common/button/Button";
import { Card } from "~/components/common/card/Card";
import { FormText } from "~/components/common/forms/FormText";
import { Skeleton } from "~/components/common/skeleton/Skeleton";
import { StateEmpty } from "~/components/common/state/StateEmpty";
import { StateError } from "~/components/common/state/StateError";
import { useModal } from "~/hooks/useModal";
import { useNotification } from "~/hooks/useNotification";
import { create, list as listClients } from "~/services/ServiceClient";
import { list as listVehicles } from "~/services/ServiceVehicle";
import { ApiError } from "~/services/ServiceHttp";
import type { ClientResponse, CreateClientRequest } from "~/types/TypeClient";
import type { Id } from "~/types/TypeCommon";
import type { SubmitResult } from "~/types/TypeError";
import { fieldOf } from "~/utils/fieldError";
import { normalizePhone } from "~/utils/phone";
import { deferred } from "~/utils/promise";
import { unlessRefused } from "~/utils/revalidate";
import type { Route } from "./+types/route";

export function meta() {
    return [{ title: "Clientes · Oficina Maggi" }];
}

// A busca casa com nome, e-mail e telefone. No telefone a comparação é por dígito: quem digita
// "(11) 9" está procurando um número, não uma pontuação.
function matches(client: ClientResponse, term: string): boolean {
    const digits = normalizePhone(term);

    return client.nome.toLowerCase().includes(term.toLowerCase())
        || client.email.toLowerCase().includes(term.toLowerCase())
        || (digits.length > 0 && client.telefone.includes(digits));
}

type Base = {
    clients: ClientResponse[];
    counts: Record<Id, number>;
};

// A contagem de veículos não vem junto do cliente, então a frota inteira vem numa chamada só e a
// conta é feita aqui — uma consulta por linha da lista seria pior.
async function loadBase(): Promise<Base> {
    const [clients, vehicles] = await Promise.all([listClients(), listVehicles()]);

    const counts: Record<Id, number> = {};

    for (const vehicle of vehicles) {
        counts[vehicle.clienteId] = (counts[vehicle.clienteId] ?? 0) + 1;
    }

    return { clients, counts };
}

// A promessa vai sem esperar: cabeçalho, busca e botão pintam na hora, e só a tabela aguarda.
export function clientLoader() {
    return { base: deferred(loadBase()) };
}

// O cadastro entra por aqui, como todo envio: a rota é quem fala com o service, e a releitura da
// lista depois de gravar vem de graça. A recusa volta com o campo que ela cita, para a janela pôr
// o erro embaixo dele; sem campo, é aviso.
export async function clientAction({ request }: Route.ClientActionArgs): Promise<SubmitResult<ClientResponse>> {
    const client: CreateClientRequest = await request.json();

    try {
        return { saved: await create(client) };
    } catch (error) {
        const message = error instanceof ApiError ? error.message : "Não foi possível cadastrar.";

        return { failure: { message, field: fieldOf(message, CLIENT_FIELDS) ?? undefined } };
    }
}

export function ErrorBoundary() {
    return (
        <Card>
            <StateError description="Não deu para carregar os clientes. Tente de novo em instantes.">
                <Button variant="primary" onClick={() => location.reload()}>Tentar de novo</Button>
            </StateError>
        </Card>
    );
}

// A busca é feita aqui, sobre o que já veio: mudar só o `?busca=` não tem por que refazer as duas
// chamadas — a resposta seria a mesma, e a tabela piscaria à toa.
export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
    const { currentUrl, nextUrl, defaultShouldRevalidate } = args;

    // Mesma URL dos dois lados é releitura pedida de propósito, e não busca: passa — menos
    // quando o que a pediu foi uma recusa.
    if (currentUrl.href === nextUrl.href) return unlessRefused(args);

    const onlyTheSearchChanged = currentUrl.pathname === nextUrl.pathname
        && [...nextUrl.searchParams.keys(), ...currentUrl.searchParams.keys()]
            .every(key => key === "busca");

    return onlyTheSearchChanged ? false : defaultShouldRevalidate;
}

export default function Clients({ loaderData }: Route.ComponentProps) {
    const [search, setSearch] = useSearchParams();
    const { open } = useModal();
    const { notify } = useNotification();
    const navigate = useNavigate();

    const term = (search.get("busca") ?? "").trim();
    const findIn = (clients: readonly ClientResponse[]) =>
        term ? clients.filter(client => matches(client, term)) : clients;
    const linkTo = (client: ClientResponse) => `/clientes/${client.id}`;

    function searchFor(value: string) {
        const next = new URLSearchParams(search);

        if (value) next.set("busca", value); else next.delete("busca");

        setSearch(next, { preventScrollReset: true });
    }

    // Cadastrar leva para a ficha, porque o passo seguinte é sempre o mesmo: o cliente novo não tem
    // veículo, e sem veículo ele não pode ser agendado.
    async function register() {
        const created = await open<ClientResponse>(
            close => <ClientCreation onDone={close} />,
            { width: "medium" }
        );

        if (!created) return;

        notify(`${created.nome} foi cadastrado. Agora adicione os veículos dele.`);
        navigate(`/clientes/${created.id}`);
    }

    return (
        <>
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight text-balance">Clientes</h1>
                    <div className="mt-0.5 text-sm text-muted">
                        {term
                            ? (
                                <Suspense fallback={<Skeleton className="mt-1 h-3 w-40" />}>
                                    <Await resolve={loaderData.base}>
                                        {({ clients }) => {
                                            const found = findIn(clients);

                                            return `${found.length} ${found.length === 1 ? "resultado" : "resultados"} para "${term}"`;
                                        }}
                                    </Await>
                                </Suspense>
                            )
                            : "Quem tem veículo atendido nesta unidade."}
                    </div>
                </div>

                <Button variant="primary" onClick={register}>Novo cliente</Button>
            </header>

            <Card>
                <form
                    className="flex flex-wrap items-end gap-3 px-4 py-3.5"
                    onSubmit={event => {
                        event.preventDefault();
                        searchFor(new FormData(event.currentTarget).get("busca") as string);
                    }}
                >
                    <div className="min-w-64 flex-1">
                        <FormText
                            label="Buscar"
                            name="busca"
                            type="search"
                            icon={Search}
                            placeholder="Nome, e-mail ou telefone"
                            defaultValue={term}
                            key={term}
                        />
                    </div>

                    <Button type="submit" variant="primary">Buscar</Button>
                    {term && <Button onClick={() => searchFor("")}>Limpar</Button>}
                </form>
            </Card>

            <Card>
                <Suspense fallback={<ClientTable clients={[]} loading vehicleCount={() => 0} linkTo={linkTo} />}>
                    <Await resolve={loaderData.base}>
                        {({ clients, counts }) => {
                            const found = findIn(clients);

                            return found.length === 0
                                ? (
                                    <StateEmpty
                                        title="Nenhum cliente encontrado"
                                        description={term
                                            ? `Ninguém com "${term}" no nome, no e-mail ou no telefone.`
                                            : "Ninguém cadastrado ainda. O primeiro cliente começa aqui."}
                                    >
                                        {term && <Button onClick={() => searchFor("")}>Ver todos</Button>}
                                        <Button variant="primary" onClick={register}>Cadastrar cliente</Button>
                                    </StateEmpty>
                                )
                                : (
                                    <ClientTable
                                        clients={found}
                                        vehicleCount={client => counts[client.id] ?? 0}
                                        linkTo={linkTo}
                                        onOpen={client => navigate(linkTo(client))}
                                    />
                                );
                        }}
                    </Await>
                </Suspense>
            </Card>
        </>
    );
}

// O envio vive aqui dentro para a janela poder mostrar a recusa da API sem fechar: quem fecha é a
// resposta boa, e é ela que a promessa devolve. O fetcher leva ao clientAction desta rota e traz a
// resposta de volta em `data`, uma por envio.
// A `action` é explícita porque a janela é desenhada pelo ModalProvider, na raiz, fora da árvore
// desta rota: sem ela o fetcher submeteria para "/", que não tem ação — 405 na tela inteira.
function ClientCreation({ onDone }: { onDone: (client?: ClientResponse) => void }) {
    const fetcher = useFetcher<typeof clientAction>();
    const { notify } = useNotification();
    const result = fetcher.data;
    const failure = result && "failure" in result ? result.failure : null;
    const errors: ClientFieldErrors = failure?.field ? { [failure.field]: failure.message } : {};

    useEffect(() => {
        if (!result) return;

        if ("saved" in result) onDone(result.saved);
        else if (!result.failure.field) notify(result.failure.message, "error");
    }, [result, onDone, notify]);

    return (
        <ClientForm
            errors={errors}
            sending={fetcher.state !== "idle"}
            onCancel={() => onDone()}
            onSubmit={client => fetcher.submit(client, {
                method: "post", action: "/clientes", encType: "application/json"
            })}
        />
    );
}

import { Check, ChevronRight, Play, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { BadgePlate } from "~/components/common/badge/BadgePlate";
import { BadgeStatus } from "~/components/common/badge/BadgeStatus";
import { Button } from "~/components/common/button/Button";
import { ButtonIcon } from "~/components/common/button/ButtonIcon";
import { Card } from "~/components/common/card/Card";
import { FormDate } from "~/components/common/forms/FormDate/FormDate";
import { FormDateRange, type DayRange } from "~/components/common/forms/FormDateRange";
import { FormEmail } from "~/components/common/forms/FormEmail";
import { FormNumber } from "~/components/common/forms/FormNumber";
import { FormPhone } from "~/components/common/forms/FormPhone";
import { FormPlate } from "~/components/common/forms/FormPlate";
import { FormRadio } from "~/components/common/forms/FormRadio";
import { FormSearch, type FormSearchOption } from "~/components/common/forms/FormSearch/FormSearch";
import { FormSelect } from "~/components/common/forms/FormSelect/FormSelect";
import { FormText } from "~/components/common/forms/FormText";
import { Modal } from "~/components/common/modal/Modal";
import { ModalProvider } from "~/components/common/modal/Modal.hook";
import { ModalBody } from "~/components/common/modal/ModalBody";
import { ModalFooter } from "~/components/common/modal/ModalFooter";
import { ModalHeader } from "~/components/common/modal/ModalHeader";
import { NavBar, type NavBarSection } from "~/components/common/navbar/NavBar";
import { NavBarLink } from "~/components/common/navbar/NavBarLink";
import { Notification, type NotificationTone } from "~/components/common/notification/Notification";
import { PageHeader } from "~/components/common/page/PageHeader";
import { Skeleton } from "~/components/common/skeleton/Skeleton";
import { SkeletonTable } from "~/components/common/skeleton/SkeletonTable";
import { StateEmpty } from "~/components/common/state/StateEmpty";
import { StateError } from "~/components/common/state/StateError";
import { Table, type TableColumn } from "~/components/common/table/Table";
import { TableCell } from "~/components/common/table/TableCell";
import { TablePagination } from "~/components/common/table/TablePagination";
import { TableRow } from "~/components/common/table/TableRow";
import { Tooltip } from "~/components/common/tooltip/Tooltip";
import type { AppointmentStatus, ServiceType } from "~/types/TypeAppointment";
import { SERVICE_LABEL } from "~/utils/service";
import { STATUS_LABEL } from "~/utils/status";

const SECTIONS: readonly NavBarSection[] = [
    { to: "/agendamentos", label: "Agendamentos" },
    { to: "/clientes", label: "Clientes" }
];

const STATUSES: readonly AppointmentStatus[] = ["Agendado", "EmAndamento", "Concluido", "Cancelado"];

const STATUS_OPTIONS = STATUSES.map(status => ({ value: status, label: STATUS_LABEL[status] }));

const SERVICE_OPTIONS = (Object.keys(SERVICE_LABEL) as ServiceType[])
    .map(service => ({ value: service, label: SERVICE_LABEL[service] }));

const CLIENTS: readonly FormSearchOption[] = [
    { value: "1", label: "José Antônio Ribeiro", detail: "(11) 98765-4321" },
    { value: "2", label: "Jose Antonio Ribeiro", detail: "(11) 3265-4321" },
    { value: "3", label: "Marina Alves", detail: "(21) 99876-1234" },
    { value: "4", label: "Carlos Eduardo Menezes", detail: "(31) 98111-2233" },
    { value: "5", label: "Ana Paula Souza", detail: "(41) 99222-3344" }
];

export function meta() {
    return [{ title: "Catálogo de componentes" }];
}

const slug = (texto: string) => texto.replace(/\W/g, "");

function Folder({ path, children }: { path: string; children: ReactNode }) {
    return (
        <section id={slug(path)} className="flex scroll-mt-6 flex-col gap-4">
            <h2 className="border-b border-line pb-2 font-mono text-lg font-bold text-primary-strong">
                {path}
            </h2>
            <div className="flex flex-col gap-5">{children}</div>
        </section>
    );
}

function Component({ name, children }: { name: string; children: ReactNode }) {
    return (
        <article id={slug(name)} className="flex scroll-mt-6 flex-col gap-3">
            <h3 className="font-mono text-sm font-semibold">{name}</h3>
            <div className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5">
                {children}
            </div>
        </article>
    );
}

const LAYOUT = {
    row: "flex flex-wrap items-center gap-3",
    grid: "grid gap-4 sm:grid-cols-2",
    stack: "flex flex-col gap-4"
};

type UsageProps = {
    code: string;
    layout?: keyof typeof LAYOUT;
    children: ReactNode;
};

function Usage({ code, layout = "row", children }: UsageProps) {
    return (
        <div className="flex flex-col gap-2">
            <code className="font-mono text-xs leading-relaxed text-muted">{code}</code>
            <div className={LAYOUT[layout]}>{children}</div>
        </div>
    );
}

const INITIAL_NOTES: readonly { id: number; tone: NotificationTone; text: string }[] = [
    { id: 1, tone: "success", text: "Agendamento criado para 24/10 às 09:00." },
    { id: 2, tone: "info", text: "A duração de 90 minutos vem do tipo Diagnóstico." },
    { id: 3, tone: "warning", text: "Faltam menos de 2 horas: este agendamento não pode mais ser cancelado." },
    { id: 4, tone: "error", text: "Este veículo já tem um agendamento nesse horário." }
];

function NotificationSample() {
    const [notes, setNotes] = useState(INITIAL_NOTES);

    function close(id: number) {
        setNotes(atuais => atuais.filter(nota => nota.id !== id));
    }

    return (
        <div className="flex w-full flex-col gap-3">
            <div className="flex flex-col gap-2">
                {notes.map(nota => (
                    <Notification key={nota.id} tone={nota.tone} onClose={() => close(nota.id)}>
                        {nota.text}
                    </Notification>
                ))}
            </div>

            <Button variant="plain" onClick={() => setNotes(INITIAL_NOTES)}>Repor os avisos</Button>
        </div>
    );
}

const COLUMNS: readonly TableColumn[] = [
    { key: "placa", label: "Placa", width: "8rem" },
    { key: "cliente", label: "Cliente" },
    { key: "servico", label: "Serviço", width: "10rem" },
    { key: "status", label: "Status", width: "10rem" },
    { key: "acoes", label: "Ações", hidden: true, right: true, width: "4rem" }
];

const ROWS = [
    { placa: "ABC1234", cliente: "Marina Alves", servico: "Revisao", status: "Agendado" },
    { placa: "ABC1D23", cliente: "Carlos Eduardo Menezes", servico: "TrocaOleo", status: "EmAndamento" },
    { placa: "XYZ9876", cliente: "Ana Paula Souza", servico: "Diagnostico", status: "Concluido" },
    { placa: "QRS4D56", cliente: "José Antônio Ribeiro", servico: "Revisao", status: "Cancelado" }
] as const;

function Rows({ take }: { take: number }) {
    return ROWS.slice(0, take).map(row => (
        <TableRow key={row.placa}>
            <TableCell><BadgePlate plate={row.placa} /></TableCell>
            <TableCell strong>{row.cliente}</TableCell>
            <TableCell>{SERVICE_LABEL[row.servico]}</TableCell>
            <TableCell><BadgeStatus status={row.status} /></TableCell>
            <TableCell right>
                <ButtonIcon to="/catalogo" label="Abrir agendamento" icon={ChevronRight} />
            </TableCell>
        </TableRow>
    ));
}

function PaginationSample() {
    const [page, setPage] = useState(1);

    return <TablePagination page={page} pageSize={20} total={137} onChange={setPage} />;
}

// As peças montadas fora do dialog: a moldura é feita de componentes comuns, e dá para vê-la
// sem abrir nada. Só a casca precisa de clique.
function ModalPreview() {
    return (
        <ModalProvider value={{ titleId: "exemplo-de-moldura", onClose: () => {} }}>
            <div className="w-full max-w-120 overflow-hidden rounded-card border border-line bg-surface shadow-lg">
                <ModalHeader
                    title="Título da janela"
                    description="A descrição é opcional e fica abaixo do título."
                />

                <ModalBody>
                    <p className="text-sm text-muted">
                        O corpo recebe qualquer conteúdo, inclusive um bloco de assunto inteiro. A
                        janela não sabe o que vai aqui dentro.
                    </p>
                </ModalBody>

                <ModalFooter>
                    <Button variant="plain">Voltar</Button>
                    <Button variant="primary">Confirmar</Button>
                </ModalFooter>
            </div>
        </ModalProvider>
    );
}

// Um estado só para as três: <dialog> abre na top layer, então duas abertas empilham.
function ModalSample() {
    const [aberta, setAberta] = useState<"narrow" | "medium" | "wide" | null>(null);
    const fechar = () => setAberta(null);

    return (
        <div className="flex flex-wrap gap-3">
            {(["narrow", "medium", "wide"] as const).map(largura => (
                <Button key={largura} variant="plain" onClick={() => setAberta(largura)}>
                    {largura}
                </Button>
            ))}

            <Modal open={aberta !== null} width={aberta ?? "medium"} onClose={fechar}>
                <ModalHeader
                    title="Janela de exemplo"
                    description={`Largura ${aberta ?? "medium"}. Escape, clique no fundo ou o × fecham.`}
                />

                <ModalBody>
                    <p className="text-sm text-muted">
                        O foco entra aqui: no primeiro campo do corpo, ou no primeiro botão do
                        rodapé quando não há campo.
                    </p>
                </ModalBody>

                <ModalFooter>
                    <Button variant="plain" onClick={fechar}>Voltar</Button>
                    <Button variant="primary" onClick={fechar}>Confirmar</Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}

function DateRangeSample() {
    const [period, setPeriod] = useState<DayRange>({ from: "2026-09-16", to: "2026-09-20" });

    return (
        <div className="flex flex-col gap-2">
            <FormDateRange fromName="dataInicio" toName="dataFim" value={period} onChange={setPeriod} />
            <code className="font-mono text-xs text-muted">
                {`{ from: "${period.from}", to: "${period.to}" }`}
            </code>
        </div>
    );
}

function RadioSample({ hideLabel = false, empty = false }: { hideLabel?: boolean; empty?: boolean }) {
    const [service, setService] = useState(empty ? "" : "Revisao");

    return (
        <FormRadio
            label="Tipo de serviço"
            hideLabel={hideLabel}
            options={SERVICE_OPTIONS}
            value={service}
            onChange={setService}
            hint={hideLabel ? undefined : "A duração vem do tipo escolhido."}
            required={!hideLabel}
        />
    );
}

type Section = {
    id: string;
    path: string;
    items: { id: string; name: string }[];
};

// Lido da própria página depois que ela monta, em vez de repetido à mão: pasta nova aparece
// sozinha, e o menu nunca lista o que já saiu.
function useSections() {
    const [sections, setSections] = useState<Section[]>([]);

    useEffect(() => {
        setSections([...document.querySelectorAll("section[id]")].map(section => ({
            id: section.id,
            path: section.querySelector("h2")?.textContent ?? section.id,
            items: [...section.querySelectorAll("article[id]")].map(article => ({
                id: article.id,
                name: article.querySelector("h3")?.textContent ?? article.id
            }))
        })));
    }, []);

    return sections;
}

// Numa página de milhares de pixels, saber onde se está vale mais que a lista. A faixa de
// observação é só o topo da tela, senão meia dúzia de seções ficaria ativa ao mesmo tempo.
function useActive(ready: boolean) {
    const [active, setActive] = useState("");

    useEffect(() => {
        if (!ready) return;

        const observer = new IntersectionObserver(
            entries => {
                const visible = entries.find(entry => entry.isIntersecting);
                if (visible) setActive(visible.target.id);
            },
            { rootMargin: "0px 0px -85% 0px" }
        );

        for (const article of document.querySelectorAll("article[id]")) observer.observe(article);

        return () => observer.disconnect();
    }, [ready]);

    return active;
}

function Menu() {
    const sections = useSections();
    const active = useActive(sections.length > 0);

    return (
        <nav aria-label="Componentes" className="flex flex-col gap-5">
            {sections.map(section => {
                const here = section.items.some(item => item.id === active);

                return (
                    <div key={section.id} className="flex flex-col gap-1.5">
                        <a
                            href={`#${section.id}`}
                            className={`font-mono text-sm font-bold no-underline transition-colors
                                ${here ? "text-primary-strong" : "text-muted hover:text-ink"}`}
                        >
                            {section.path}
                        </a>

                        <ul className="flex flex-col">
                            {section.items.map(item => (
                                <li key={item.id} className="flex">
                                    <a
                                        href={`#${item.id}`}
                                        aria-current={item.id === active ? "location" : undefined}
                                        className={`flex-1 border-l py-1 pl-3 font-mono text-xs
                                            no-underline transition-colors ${item.id === active
                                                ? "border-primary bg-primary-soft font-semibold text-primary"
                                                : "border-line text-muted hover:border-line-strong hover:text-ink"}`}
                                    >
                                        {item.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </nav>
    );
}

export default function Catalogo() {
    return (
        <div className="flex min-h-screen">
            <aside
                className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r
                    border-line bg-surface px-5 py-6 lg:block"
            >
                <header className="mb-6">
                    <p className="text-lg font-semibold tracking-tight">Catálogo</p>
                    <p className="text-xs text-muted">Cada componente em todos os seus estados.</p>
                </header>

                <Menu />
            </aside>

            <main className="mx-auto flex min-w-0 max-w-5xl flex-1 flex-col gap-9 px-6 py-8">
                <header className="lg:hidden">
                    <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
                    <p className="text-sm text-muted">
                        Os componentes por pasta, cada um em todos os seus estados.
                    </p>
                </header>

                <Folder path="common/badge/">
                    <Component name="BadgePlate">
                        <Usage code='<BadgePlate plate="ABC1234" />  formato antigo, ganha hífen'>
                            <BadgePlate plate="ABC1234" />
                        </Usage>
                        <Usage code='<BadgePlate plate="ABC1D23" />  Mercosul, fica sem hífen'>
                            <BadgePlate plate="ABC1D23" />
                        </Usage>
                        <Usage code='<BadgePlate plate="abc-1234" />  normaliza o que vier'>
                            <BadgePlate plate="abc-1234" />
                        </Usage>
                    </Component>

                    <Component name="BadgeStatus">
                        <Usage code="<BadgeStatus status={...} />  os quatro status">
                            {STATUSES.map(status => <BadgeStatus key={status} status={status} />)}
                        </Usage>
                    </Component>
                </Folder>

                <Folder path="common/button/">
                    <Component name="Button">
                        <Usage code='<Button variant="primary">Agendar</Button>'>
                            <Button variant="primary">Agendar</Button>
                            <Button variant="plain">Voltar</Button>
                            <Button variant="danger">Cancelar agendamento</Button>
                            <Button variant="dangerStrong">Confirmar cancelamento</Button>
                        </Usage>
                        <Usage code='<Button to="/agendamentos">  com "to" vira link'>
                            <Button to="/catalogo" variant="primary">Novo agendamento</Button>
                            <Button to="/catalogo" variant="plain">Ver clientes</Button>
                        </Usage>
                        <Usage code="<Button disabled>">
                            <Button variant="primary" disabled>Agendar</Button>
                            <Button variant="plain" disabled>Voltar</Button>
                        </Usage>
                    </Component>

                    <Component name="ButtonIcon">
                        <Usage code='<ButtonIcon label="Iniciar serviço" icon={Play} tone="primary" />'>
                            <ButtonIcon label="Iniciar serviço" icon={Play} tone="primary" />
                            <ButtonIcon label="Concluir serviço" icon={Check} tone="done" />
                            <ButtonIcon label="Cancelar agendamento" icon={X} tone="danger" />
                            <ButtonIcon label="Fechar" icon={X} size={18} />
                            <ButtonIcon label="Desabilitado" icon={Play} tone="primary" disabled />
                        </Usage>
                        <Usage code='<ButtonIcon to="..." label="Abrir agendamento" icon={ChevronRight} />'>
                            <ButtonIcon to="/catalogo" label="Abrir agendamento" icon={ChevronRight} />
                        </Usage>
                    </Component>
                </Folder>

                <Folder path="common/card/">
                    <Component name="Card">
                        <Usage code="<Card>{tabela}</Card>  sem padding: a tabela vai de ponta a ponta" layout="stack">
                            <Card>
                                <Table columns={COLUMNS}><Rows take={2} /></Table>
                                <TablePagination page={1} pageSize={20} total={137} onChange={() => {}} />
                            </Card>
                        </Usage>
                        <Usage code="<Card>{conteúdo com o seu padding}</Card>" layout="stack">
                            <Card>
                                <div className="grid gap-4 p-4 sm:grid-cols-2">
                                    <FormText label="Nome" placeholder="Ana Souza" />
                                    <FormEmail label="E-mail" placeholder="ana.souza@email.com" />
                                </div>
                            </Card>
                        </Usage>
                    </Component>
                </Folder>

                <Folder path="common/forms/">
                    <Component name="FormDate">
                        <Usage code="<FormDate />  calendário nosso, sem o do navegador" layout="grid">
                            <FormDate label="Data" required />
                            <FormDate label="Data" defaultValue="2026-09-16" />
                        </Usage>
                        <Usage code='<FormDate min="2026-09-16" />  bloqueia o passado, como a regra 1' layout="grid">
                            <FormDate label="Data" min="2026-09-16" hint="Não dá para marcar antes de hoje." />
                            <FormDate label="Data" defaultValue="2026-09-16" error="Escolha uma data." />
                        </Usage>
                    </Component>

                    <Component name="FormDateRange">
                        <Usage code="<FormDateRange value onChange />  mover o de para depois do até empurra o até">
                            <DateRangeSample />
                        </Usage>
                    </Component>

                    <Component name="FormEmail">
                        <Usage code="<FormEmail label />  teclado de e-mail, sem corretor, limite de 254" layout="grid">
                            <FormEmail label="E-mail" placeholder="maria@email.com" required />
                            <FormEmail
                                label="E-mail"
                                defaultValue="maria@email.com"
                                error="Já existe um cliente com este e-mail."
                            />
                        </Usage>
                    </Component>

                    <Component name="FormNumber">
                        <Usage code="<FormNumber digits={4} />  só dígito passa, sem setinha do navegador" layout="grid">
                            <FormNumber label="Ano" digits={4} placeholder="2024" required />
                            <FormNumber label="Ano" digits={4} defaultValue={2030} error="Ano deve estar entre 1900 e 2027." />
                        </Usage>
                    </Component>

                    <Component name="FormPhone">
                        <Usage code="<FormPhone label />  formata a cada tecla, digite para ver" layout="grid">
                            <FormPhone label="Telefone" required />
                            <FormPhone label="Telefone" defaultValue="1132654321" hint="Fixo quebra em 4-4." />
                        </Usage>
                        <Usage code="<FormPhone defaultValue error disabled />" layout="grid">
                            <FormPhone label="Telefone" defaultValue="11987654321" error="Telefone inválido." />
                            <FormPhone label="Telefone" defaultValue="5511987654321" disabled />
                        </Usage>
                    </Component>

                    <Component name="FormPlate">
                        <Usage code="<FormPlate />  maiúsculas sempre, hífen só quando a placa fecha" layout="grid">
                            <FormPlate label="Placa" required />
                            <FormPlate label="Placa" defaultValue="abc1234" hint="Formato antigo ganha hífen." />
                        </Usage>
                    </Component>

                    <Component name="FormRadio">
                        <Usage code="<FormRadio value onChange />  rótulo pelo FormField, setas andam entre as opções">
                            <RadioSample />
                        </Usage>
                        <Usage code="<FormRadio hideLabel />  some da tela, continua no leitor de tela">
                            <RadioSample hideLabel />
                        </Usage>
                        <Usage code='<FormRadio value="" />  sem escolha: o Tab entra pelo primeiro'>
                            <RadioSample empty />
                        </Usage>
                    </Component>

                    <Component name="FormSearch">
                        <Usage code="<FormSearch options={...} />  digite jose e ache também José" layout="grid">
                            <FormSearch label="Cliente" name="clienteId" options={CLIENTS} required />
                            <FormSearch label="Cliente" options={CLIENTS} defaultValue="3" />
                        </Usage>
                        <Usage code="<FormSearch error />  e <FormSearch disabled />" layout="grid">
                            <FormSearch label="Cliente" options={CLIENTS} error="Escolha um cliente." />
                            <FormSearch label="Cliente" options={CLIENTS} defaultValue="5" disabled />
                        </Usage>
                    </Component>

                    <Component name="FormSelect">
                        <Usage code="<FormSelect options={...} defaultValue />  fechado, abre no clique" layout="grid">
                            <FormSelect label="Status" options={STATUS_OPTIONS} defaultValue="Agendado" required />
                            <FormSelect label="Status" options={STATUS_OPTIONS} placeholder="Todos" />
                        </Usage>
                        <Usage code="<FormSelect error />  e <FormSelect disabled />" layout="grid">
                            <FormSelect label="Status" options={STATUS_OPTIONS} error="Escolha um status." />
                            <FormSelect label="Status" options={STATUS_OPTIONS} defaultValue="Concluido" disabled />
                        </Usage>
                    </Component>

                    <Component name="FormText">
                        <Usage code="<FormText required />  a estrela marca o obrigatório" layout="grid">
                            <FormText label="Nome" placeholder="Maria Silva" hint="Como aparece na ordem de serviço." required />
                            <FormText label="Modelo" placeholder="Gol 1.0" />
                        </Usage>
                        <Usage code="<FormText error />  a dica some, o erro ocupa o lugar" layout="grid">
                            <FormText
                                label="Modelo"
                                defaultValue="G"
                                hint="Esta dica não aparece."
                                error="Modelo deve ter ao menos 2 caracteres."
                            />
                        </Usage>
                        <Usage code="<FormText disabled />  e <FormText wide />, que atravessa a grade" layout="grid">
                            <FormText label="Placa" defaultValue="ABC1D23" disabled />
                            <FormText label="Observação" placeholder="Opcional" wide />
                        </Usage>
                    </Component>
                </Folder>

                <Folder path="common/modal/">
                    <Component name="Modal">
                        <Usage
                            code="<ModalHeader/> <ModalBody/> <ModalFooter/>  a moldura, fora do dialog para poder ser vista"
                            layout="stack"
                        >
                            <ModalPreview />
                        </Usage>
                        <Usage code="<Modal open width onClose />  a casca: abre, prende o foco, fecha" layout="stack">
                            <ModalSample />
                        </Usage>
                    </Component>
                </Folder>

                <Folder path="common/navbar/">
                    <Component name="NavBar">
                        <Usage
                            code="<NavBar home sections />  as rotas vêm de fora; a seção atual se marca sozinha pela URL"
                            layout="stack"
                        >
                            <Card>
                                <NavBar home="/agendamentos" sections={SECTIONS} />
                            </Card>
                        </Usage>
                    </Component>

                    <Component name="NavBarLink">
                        <Usage code="<NavBarLink to>  NavLink por dentro: o ativo vem da URL, e o aria-current é dele">
                            <NavBarLink to="/catalogo">Esta rota, então ativo</NavBarLink>
                            <NavBarLink to="/agendamentos">Agendamentos</NavBarLink>
                            <NavBarLink to="/clientes">Clientes</NavBarLink>
                        </Usage>
                    </Component>
                </Folder>

                <Folder path="common/notification/">
                    <Component name="Notification">
                        <Usage code="<Notification tone onClose>{texto}</Notification>" layout="stack">
                            <NotificationSample />
                        </Usage>
                    </Component>
                </Folder>

                <Folder path="common/page/">
                    <Component name="PageHeader">
                        <Usage code="<PageHeader title subtitle>{ação}</PageHeader>" layout="stack">
                            <PageHeader title="Clientes" subtitle="Quem tem veículo atendido nesta unidade.">
                                <Button variant="primary">Novo cliente</Button>
                            </PageHeader>
                        </Usage>
                        <Usage code="<PageHeader title />  sem subtítulo e sem ação" layout="stack">
                            <PageHeader title="Novo agendamento" />
                        </Usage>
                    </Component>
                </Folder>

                <Folder path="common/skeleton/">
                    <Component name="Skeleton">
                        <Usage code="<Skeleton />  sem filhos, vira barra" layout="stack">
                            <Skeleton />
                            <Skeleton className="h-3 w-2/5" />
                            <Skeleton className="h-8 w-1/4" />
                        </Usage>
                        <Usage
                            code="<Skeleton>{...}</Skeleton>  com filhos, vira caixa: o esqueleto de qualquer tela sai daqui, aninhando"
                            layout="stack"
                        >
                            <Skeleton
                                label="Carregando"
                                className="flex w-full flex-col gap-4 rounded-card border border-line bg-surface p-4"
                            >
                                <div className="flex items-center gap-4">
                                    <Skeleton className="size-12 rounded-full" />
                                    <div className="flex flex-1 flex-col gap-2">
                                        <Skeleton className="h-5 w-2/5" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                    <Skeleton className="h-6 w-24 rounded-full" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <Skeleton />
                                    <Skeleton />
                                    <Skeleton />
                                </div>
                            </Skeleton>
                        </Usage>
                    </Component>

                    <Component name="SkeletonTable">
                        <Usage code="<SkeletonTable columns={5} />  a única forma que se repete" layout="grid">
                            <SkeletonTable columns={5} />
                            <SkeletonTable columns={3} rows={2} />
                        </Usage>
                    </Component>
                </Folder>

                <Folder path="common/state/">
                    <Component name="StateEmpty">
                        <Usage code="<StateEmpty title description>{ação}</StateEmpty>" layout="stack">
                            <StateEmpty
                                title="Nenhum agendamento neste período"
                                description="Tente outro intervalo de datas, ou marque um serviço novo."
                            >
                                <Button to="/catalogo" variant="primary">Novo agendamento</Button>
                            </StateEmpty>
                        </Usage>
                        <Usage code='<StateEmpty label="Erro 404" />  é o que a página de 404 usa' layout="stack">
                            <StateEmpty
                                label="Erro 404"
                                title="Página não encontrada"
                                description="O endereço não existe ou foi movido."
                            >
                                <Button to="/catalogo" variant="plain">Voltar para a agenda</Button>
                            </StateEmpty>
                        </Usage>
                    </Component>

                    <Component name="StateError">
                        <Usage code="<StateError description={erro da API}>{ação}</StateError>" layout="stack">
                            <StateError description="O servidor demorou demais para responder.">
                                <Button variant="primary">Tentar de novo</Button>
                            </StateError>
                        </Usage>
                        <Usage code="<StateError />  sem detalhe, quando a falha não tem mensagem" layout="stack">
                            <StateError />
                        </Usage>
                    </Component>
                </Folder>

                <Folder path="common/table/">
                    <Component name="Table">
                        <Usage
                            code="<Table columns>{<TableRow><TableCell/></TableRow>}</Table>  largura pelo colgroup, ações com rótulo só para o leitor de tela"
                            layout="stack"
                        >
                            <Card>
                                <Table columns={COLUMNS}><Rows take={4} /></Table>
                            </Card>
                        </Usage>
                    </Component>

                    <Component name="TablePagination">
                        <Usage
                            code="<TablePagination page pageSize total onChange />  vive colado embaixo da tabela: o border-t dele é a única linha entre as duas"
                            layout="stack"
                        >
                            <Card>
                                <Table columns={COLUMNS}><Rows take={2} /></Table>
                                <PaginationSample />
                            </Card>
                        </Usage>
                        <Usage code="na última página, com a Próxima desligada" layout="stack">
                            <Card>
                                <Table columns={COLUMNS}><Rows take={2} /></Table>
                                <TablePagination page={7} pageSize={20} total={137} onChange={() => {}} />
                            </Card>
                        </Usage>
                    </Component>
                </Folder>

                <Folder path="common/tooltip/">
                    <Component name="Tooltip">
                        <Usage code="<Tooltip text>{gatilho}</Tooltip>  passe o mouse, ou chegue pelo Tab">
                            <Tooltip text="Iniciar serviço">
                                <ButtonIcon label="Iniciar serviço" icon={Play} tone="primary" />
                            </Tooltip>
                            <Tooltip text="Concluir serviço">
                                <ButtonIcon label="Concluir serviço" icon={Check} tone="done" />
                            </Tooltip>
                            <Tooltip text="Cancelar agendamento">
                                <ButtonIcon label="Cancelar agendamento" icon={X} tone="danger" />
                            </Tooltip>
                            <Tooltip text="Abre o agendamento em outra tela">
                                <Button variant="plain">Ver detalhe</Button>
                            </Tooltip>
                        </Usage>
                        <Usage code="dentro da tabela, onde o contêiner rola: a bolha vai para o body e não é cortada" layout="stack">
                            <Card>
                                <Table columns={COLUMNS}>
                                    {ROWS.slice(0, 2).map(row => (
                                        <TableRow key={row.placa}>
                                            <TableCell><BadgePlate plate={row.placa} /></TableCell>
                                            <TableCell strong>{row.cliente}</TableCell>
                                            <TableCell>{SERVICE_LABEL[row.servico]}</TableCell>
                                            <TableCell><BadgeStatus status={row.status} /></TableCell>
                                            <TableCell right>
                                                <Tooltip text={`Abrir o agendamento de ${row.cliente}`}>
                                                    <ButtonIcon to="/catalogo" label="Abrir agendamento" icon={ChevronRight} />
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </Table>
                            </Card>
                        </Usage>
                    </Component>
                </Folder>
            </main>
        </div>
    );
}

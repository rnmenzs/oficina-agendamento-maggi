import { Check, ChevronRight, Play, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { BadgePlate } from "~/components/badge/BadgePlate";
import { BadgeStatus } from "~/components/badge/BadgeStatus";
import { Button } from "~/components/button/Button";
import { ButtonIcon } from "~/components/button/ButtonIcon";
import { FormDate } from "~/components/forms/FormDate/FormDate";
import { FormDateRange, type DayRange } from "~/components/forms/FormDateRange";
import { FormEmail } from "~/components/forms/FormEmail";
import { FormNumber } from "~/components/forms/FormNumber";
import { FormPhone } from "~/components/forms/FormPhone";
import { FormPlate } from "~/components/forms/FormPlate";
import { FormRadio } from "~/components/forms/FormRadio";
import { FormSearch, type FormSearchOption } from "~/components/forms/FormSearch/FormSearch";
import { FormSelect } from "~/components/forms/FormSelect/FormSelect";
import { FormText } from "~/components/forms/FormText";
import type { AppointmentStatus, ServiceType } from "~/types/TypeAppointment";
import { SERVICE_LABEL } from "~/utils/service";
import { STATUS_LABEL } from "~/utils/status";

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

function Folder({ path, children }: { path: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-4">
            <h2 className="border-b border-line pb-2 font-mono text-lg font-bold text-primary-strong">
                {path}
            </h2>
            <div className="flex flex-col gap-5">{children}</div>
        </section>
    );
}

function Component({ name, children }: { name: string; children: ReactNode }) {
    return (
        <article className="flex flex-col gap-3">
            <h3 className="font-mono text-sm font-semibold">{name}</h3>
            <div className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5">
                {children}
            </div>
        </article>
    );
}

function Usage({ code, grid = false, children }: { code: string; grid?: boolean; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <code className="font-mono text-xs leading-relaxed text-muted">{code}</code>
            <div className={grid ? "grid gap-4 sm:grid-cols-2" : "flex flex-wrap items-center gap-3"}>
                {children}
            </div>
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

function RadioSample({ hideLabel = false }: { hideLabel?: boolean }) {
    const [service, setService] = useState("Revisao");

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

export default function Catalogo() {
    return (
        <main className="mx-auto flex max-w-6xl flex-col gap-9 px-5 py-6">
            <header>
                <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
                <p className="text-sm text-muted">
                    Os componentes por pasta, cada um em todos os seus estados.
                </p>
            </header>

            <Folder path="badge/">
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

            <Folder path="button/">
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

            <Folder path="forms/">
                <Component name="FormDate">
                    <Usage code="<FormDate />  calendário nosso, sem o do navegador" grid>
                        <FormDate label="Data" required />
                        <FormDate label="Data" defaultValue="2026-09-16" />
                    </Usage>
                    <Usage code='<FormDate min="2026-09-16" />  bloqueia o passado, como a regra 1' grid>
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
                    <Usage code="<FormEmail label />  teclado de e-mail, sem corretor, limite de 254" grid>
                        <FormEmail label="E-mail" placeholder="maria@email.com" required />
                        <FormEmail
                            label="E-mail"
                            defaultValue="maria@email.com"
                            error="Já existe um cliente com este e-mail."
                        />
                    </Usage>
                </Component>

                <Component name="FormNumber">
                    <Usage code="<FormNumber digits={4} />  só dígito passa, sem setinha do navegador" grid>
                        <FormNumber label="Ano" digits={4} placeholder="2024" required />
                        <FormNumber label="Ano" digits={4} defaultValue={2030} error="Ano deve estar entre 1900 e 2027." />
                    </Usage>
                </Component>

                <Component name="FormPhone">
                    <Usage code="<FormPhone label />  formata a cada tecla, digite para ver" grid>
                        <FormPhone label="Telefone" required />
                        <FormPhone label="Telefone" defaultValue="1132654321" hint="Fixo quebra em 4-4." />
                    </Usage>
                    <Usage code="<FormPhone defaultValue error disabled />" grid>
                        <FormPhone label="Telefone" defaultValue="11987654321" error="Telefone inválido." />
                        <FormPhone label="Telefone" defaultValue="5511987654321" disabled />
                    </Usage>
                </Component>

                <Component name="FormPlate">
                    <Usage code="<FormPlate />  maiúsculas sempre, hífen só quando a placa fecha" grid>
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
                </Component>

                <Component name="FormSearch">
                    <Usage code="<FormSearch options={...} />  digite jose e ache também José" grid>
                        <FormSearch label="Cliente" name="clienteId" options={CLIENTS} required />
                        <FormSearch label="Cliente" options={CLIENTS} defaultValue="3" />
                    </Usage>
                    <Usage code="<FormSearch error />  e <FormSearch disabled />" grid>
                        <FormSearch label="Cliente" options={CLIENTS} error="Escolha um cliente." />
                        <FormSearch label="Cliente" options={CLIENTS} defaultValue="5" disabled />
                    </Usage>
                </Component>

                <Component name="FormSelect">
                    <Usage code="<FormSelect options={...} defaultValue />  fechado, abre no clique" grid>
                        <FormSelect label="Status" options={STATUS_OPTIONS} defaultValue="Agendado" required />
                        <FormSelect label="Status" options={STATUS_OPTIONS} placeholder="Todos" />
                    </Usage>
                    <Usage code="<FormSelect error />  e <FormSelect disabled />" grid>
                        <FormSelect label="Status" options={STATUS_OPTIONS} error="Escolha um status." />
                        <FormSelect label="Status" options={STATUS_OPTIONS} defaultValue="Concluido" disabled />
                    </Usage>
                </Component>

                <Component name="FormText">
                    <Usage code="<FormText required />  a estrela marca o obrigatório" grid>
                        <FormText label="Nome" placeholder="Maria Silva" hint="Como aparece na ordem de serviço." required />
                        <FormText label="Modelo" placeholder="Gol 1.0" />
                    </Usage>
                    <Usage code="<FormText error />  a dica some, o erro ocupa o lugar" grid>
                        <FormText
                            label="Modelo"
                            defaultValue="G"
                            hint="Esta dica não aparece."
                            error="Modelo deve ter ao menos 2 caracteres."
                        />
                    </Usage>
                    <Usage code="<FormText disabled />  e <FormText wide />, que atravessa a grade" grid>
                        <FormText label="Placa" defaultValue="ABC1D23" disabled />
                        <FormText label="Observação" placeholder="Opcional" wide />
                    </Usage>
                </Component>
            </Folder>
        </main>
    );
}

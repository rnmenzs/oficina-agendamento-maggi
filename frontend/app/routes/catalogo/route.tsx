import { Check, ChevronRight, Play, X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "~/components/button/Button";
import { ButtonIcon } from "~/components/button/ButtonIcon";

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

function Usage({ code, children }: { code: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <code className="font-mono text-xs leading-relaxed text-muted">{code}</code>
            <div className="flex flex-wrap items-center gap-3">{children}</div>
        </div>
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
        </main>
    );
}

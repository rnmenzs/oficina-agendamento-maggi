import { redirect, useFetcher } from "react-router";

import { Button } from "~/components/common/button/Button";
import { Card } from "~/components/common/card/Card";
import { FormText } from "~/components/common/forms/FormText";
import { Brand } from "~/components/common/navbar/Brand";
import { login } from "~/services/ServiceAuth";
import { ApiError } from "~/services/ServiceHttp";
import { isAuthenticated, saveToken } from "~/services/ServiceSession";
import type { SubmitResult } from "~/types/TypeError";
import type { Route } from "./+types/route";

export function meta() {
    return [{ title: "Entrar · Oficina Maggi" }];
}

// Já logado, a tela não tem o que oferecer: vai direto para a agenda.
export function clientLoader() {
    if (isAuthenticated()) throw redirect("/agendamentos");

    return null;
}

export async function clientAction({ request }: Route.ClientActionArgs) {
    const form = await request.formData();
    const username = String(form.get("usuario") ?? "").trim();
    const password = String(form.get("senha") ?? "");

    if (!username || !password) {
        return { failure: { message: "Preencha usuário e senha." } } satisfies SubmitResult<never>;
    }

    try {
        const { token } = await login({ usuario: username, senha: password });
        saveToken(token);

        return redirect("/agendamentos");
    } catch (error) {
        const message = error instanceof ApiError ? error.message : "Não foi possível entrar.";

        return { failure: { message } } satisfies SubmitResult<never>;
    }
}

export default function Login() {
    const fetcher = useFetcher<typeof clientAction>();
    const sending = fetcher.state !== "idle";
    const failure = fetcher.data && "failure" in fetcher.data ? fetcher.data.failure : null;

    return (
        <main className="flex min-h-dvh items-center justify-center px-5 py-8">
            <div className="w-full max-w-sm">
                <Card>
                    {/* Os campos ficam ativos durante o envio, como nos outros formulários: desabilitar
                        um campo com foco o tira dali, e quem errou a senha teria que clicar de novo. */}
                    <fetcher.Form method="post" className="flex flex-col gap-5 px-6 py-8">
                        <div className="flex flex-col items-center gap-1">
                            <h1><Brand /></h1>
                            <p className="text-sm text-muted">Entre para continuar</p>
                        </div>

                        <FormText
                            label="Usuário"
                            name="usuario"
                            autoComplete="username"
                            autoFocus
                            required
                        />

                        <FormText
                            label="Senha"
                            name="senha"
                            type="password"
                            autoComplete="current-password"
                            required
                            error={failure?.message}
                        />

                        <Button type="submit" variant="primary" disabled={sending} className="w-full">
                            {sending ? "Entrando…" : "Entrar"}
                        </Button>
                    </fetcher.Form>
                </Card>
            </div>
        </main>
    );
}

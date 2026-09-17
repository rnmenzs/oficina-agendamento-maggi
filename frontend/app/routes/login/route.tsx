import { redirect, useFetcher } from "react-router";

import { Card } from "~/components/common/card/Card";
import { isAuthenticated, saveToken } from "~/services/auth";
import { ApiError, request } from "~/services/ServiceHttp";
import type { LoginResponse } from "~/types/TypeAuth";
import type { SubmitFailure, SubmitResult } from "~/types/TypeError";
import type { Route } from "./+types/route";

export function meta() {
    return [{ title: "Entrar · Oficina Maggi" }];
}

// Já logado? Vai direto para a agenda.
export function clientLoader() {
    if (isAuthenticated()) throw redirect("/agendamentos");
    return null;
}

export async function clientAction({ request: req }: Route.ClientActionArgs) {
    const form = await req.formData();
    const usuario = String(form.get("usuario") ?? "").trim();
    const senha = String(form.get("senha") ?? "");

    if (!usuario || !senha) {
        return { failure: { message: "Preencha usuário e senha." } } satisfies SubmitResult<never>;
    }

    try {
        const { token } = await request<LoginResponse>("/auth/login", {
            method: "POST",
            body: { usuario, senha }
        });
        saveToken(token);
        return redirect("/agendamentos");
    } catch (error) {
        const message = error instanceof ApiError
            ? error.message
            : "Não foi possível fazer login.";
        return { failure: { message } } satisfies SubmitResult<never>;
    }
}

export default function Login() {
    const fetcher = useFetcher<SubmitResult<never>>();
    const busy = fetcher.state !== "idle";

    const failure = fetcher.data && "failure" in fetcher.data
        ? (fetcher.data as { failure: SubmitFailure }).failure
        : null;

    return (
        <main className="flex min-h-dvh items-center justify-center bg-surface-alt px-4">
            <div className="w-full max-w-sm">
                <Card>
                    <fetcher.Form method="post" className="flex flex-col gap-5 px-6 py-8">
                        <div className="text-center">
                            <h1 className="text-xl font-bold tracking-tight text-ink">
                                Maggi
                                <span className="ml-2 text-xs font-normal tracking-widest text-muted uppercase">
                                    Oficina
                                </span>
                            </h1>
                            <p className="mt-1 text-sm text-muted">Entre para continuar</p>
                        </div>

                        {failure && (
                            <p role="alert" className="rounded-sm bg-danger-soft px-3 py-2 text-sm text-danger">
                                {failure.message}
                            </p>
                        )}

                        <div className="flex flex-col gap-1">
                            <label htmlFor="usuario" className="text-sm font-medium text-ink">
                                Usuário
                            </label>
                            <input
                                id="usuario"
                                name="usuario"
                                type="text"
                                autoComplete="username"
                                required
                                disabled={busy}
                                className="rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink
                                    outline-none transition-colors placeholder:text-muted
                                    focus:border-primary focus:ring-1 focus:ring-primary
                                    disabled:opacity-60"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="senha" className="text-sm font-medium text-ink">
                                Senha
                            </label>
                            <input
                                id="senha"
                                name="senha"
                                type="password"
                                autoComplete="current-password"
                                required
                                disabled={busy}
                                className="rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink
                                    outline-none transition-colors placeholder:text-muted
                                    focus:border-primary focus:ring-1 focus:ring-primary
                                    disabled:opacity-60"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={busy}
                            className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-on-primary
                                transition-colors hover:bg-primary-hover disabled:opacity-60"
                        >
                            {busy ? "Entrando…" : "Entrar"}
                        </button>
                    </fetcher.Form>
                </Card>
            </div>
        </main>
    );
}

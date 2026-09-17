import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import { Button } from "./components/common/button/Button";
import { Card } from "./components/common/card/Card";
import { LoadingBar } from "./components/common/loading/LoadingBar";
import { StateEmpty } from "./components/common/state/StateEmpty";
import { ModalProvider } from "./context/ModalContext";
import { NotificationProvider } from "./context/NotificationContext";
import type { Route } from "./+types/root";
import "./styles.css";

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <Meta />
                <Links />
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    return (
        <NotificationProvider>
            <ModalProvider>
                <Outlet />
            </ModalProvider>
        </NotificationProvider>
    );
}

// O que aparece enquanto o JS da primeira tela ainda baixa. Sem SSR o React Router não pinta
// nada até lá, e o padrão dele é um <body> vazio. Sem a NavBar: o usuário pode estar na /login,
// e mostrar a barra por um instante antes de ela sumir seria um flash visual.
export function HydrateFallback() {
    return <LoadingBar active />;
}

// Último anteparo: erro que nenhuma tela tratou. Sem navegação, porque pode ter quebrado antes
// de a casca existir — só o caminho de volta.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    const notFound = isRouteErrorResponse(error) && error.status === 404;

    return (
        <main className="mx-auto flex max-w-2xl flex-col px-5 py-16">
            <Card>
                <StateEmpty
                    label={isRouteErrorResponse(error) ? `Erro ${error.status}` : "Erro"}
                    title={notFound ? "Esta página não existe" : "Algo deu errado"}
                    description={notFound
                        ? "O endereço pode ter mudado, ou o que você procurava foi removido."
                        : "A aplicação não conseguiu continuar. Tente de novo em instantes."}
                >
                    <Button to="/agendamentos" variant="primary">Ir para a agenda</Button>
                </StateEmpty>

                {/* Em desenvolvimento o erro cru vai junto: a frase é para quem usa, o stack é para
                    quem conserta. Fora de desenvolvimento, só a frase. */}
                {import.meta.env.DEV && error instanceof Error && (
                    <pre className="max-h-72 overflow-auto border-t border-line px-5 py-4 font-mono text-xs
                        whitespace-pre-wrap text-muted">
                        {error.stack ?? error.message}
                    </pre>
                )}
            </Card>
        </main>
    );
}

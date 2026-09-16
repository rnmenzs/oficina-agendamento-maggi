import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

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
    return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    const naoEncontrado = isRouteErrorResponse(error) && error.status === 404;

    return (
        <main>
            <h1>{naoEncontrado ? "Página não encontrada" : "Algo deu errado"}</h1>
            <p>
                {isRouteErrorResponse(error)
                    ? error.statusText || "A aplicação não conseguiu continuar."
                    : "A aplicação não conseguiu continuar."}
            </p>
        </main>
    );
}

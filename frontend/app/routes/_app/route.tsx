import { Outlet, redirect, useNavigation, useRevalidator } from "react-router";

import { LoadingBar } from "~/components/common/loading/LoadingBar";
import { NavBar } from "~/components/common/navbar/NavBar";
import { isAuthenticated, logout } from "~/utils/session";
import { HOME, SECTIONS } from "./sections";

// Guarda de autenticação: sem token, nenhuma tela do sistema carrega.
export function clientLoader() {
    if (!isAuthenticated()) throw redirect("/login");
    return null;
}

// A casca das telas vive aqui, e não no root, para o catálogo ficar de fora: ele tem layout
// próprio. As rotas conhecem a URL; os componentes, não.
export default function AppLayout() {
    const navigation = useNavigation();
    const revalidator = useRevalidator();

    // Tudo o que o roteador sabe que está em curso: navegar, enviar formulário, reler a tela
    // depois de uma ação. É o sinal que sobra quando nenhuma tabela está trocando por esqueleto.
    const working = navigation.state !== "idle" || revalidator.state !== "idle";

    return (
        <>
            <LoadingBar active={working} />
            <NavBar home={HOME} sections={SECTIONS} onLogout={logout} />

            <main className="mx-auto flex max-w-6xl flex-col gap-3 px-5 pt-5 pb-4">
                <Outlet />
            </main>
        </>
    );
}

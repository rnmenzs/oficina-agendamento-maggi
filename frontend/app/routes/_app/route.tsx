import { Outlet } from "react-router";

import { NavBar, type NavBarSection } from "~/components/common/navbar/NavBar";

const SECTIONS: readonly NavBarSection[] = [
    { to: "/agendamentos", label: "Agendamentos" },
    { to: "/clientes", label: "Clientes" }
];

// A casca das telas vive aqui, e não no root, para o catálogo ficar de fora: ele tem layout
// próprio. As rotas conhecem a URL; os componentes, não.
export default function AppLayout() {
    return (
        <>
            <NavBar home="/agendamentos" sections={SECTIONS} />

            <main className="mx-auto flex max-w-6xl flex-col gap-4 px-5 pt-6 pb-12">
                <Outlet />
            </main>
        </>
    );
}

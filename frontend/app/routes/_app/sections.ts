import type { NavBarSection } from "~/components/common/navbar/NavBar";

// Num arquivo à parte porque a raiz também desenha a casca, no primeiro carregamento, antes de
// qualquer rota existir. Aqui dentro da pasta da rota, o flatRoutes não o toma por rota.
export const HOME = "/agendamentos";

export const SECTIONS: readonly NavBarSection[] = [
    { to: "/agendamentos", label: "Agendamentos" },
    { to: "/clientes", label: "Clientes" }
];

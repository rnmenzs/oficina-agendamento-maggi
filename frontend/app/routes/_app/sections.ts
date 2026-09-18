import type { NavBarSection } from "~/components/common/navbar/NavBar";

// Fora do route.tsx porque um módulo de rota só exporta o que o React Router conhece. Aqui
// dentro da pasta da rota, o flatRoutes não o toma por rota.
export const HOME = "/agendamentos";

export const SECTIONS: readonly NavBarSection[] = [
    { to: "/agendamentos", label: "Agendamentos" },
    { to: "/clientes", label: "Clientes" }
];

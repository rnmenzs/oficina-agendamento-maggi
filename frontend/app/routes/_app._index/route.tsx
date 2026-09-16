import { redirect } from "react-router";

// O enunciado manda a raiz levar para a agenda.
export function clientLoader() {
    return redirect("/agendamentos");
}

export default function Home() {
    return null;
}

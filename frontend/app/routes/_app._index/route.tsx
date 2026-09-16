import { redirect } from "react-router";

export function clientLoader() {
    return redirect("/agendamentos");
}

export default function Home() {
    return null;
}

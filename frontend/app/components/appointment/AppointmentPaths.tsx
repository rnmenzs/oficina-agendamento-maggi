import { Card } from "../common/card/Card";
import { actionsFor } from "~/hooks/useStatusActions";
import type { AppointmentStatus } from "~/types/TypeAppointment";

/**
 * O caixa sai das mesmas transições que desenham os botões, e some num estado final: listar as
 * regras do domínio como texto fixo daria conselho sobre o que já não pode acontecer.
 */
export function AppointmentPaths({ status }: { status: AppointmentStatus }) {
    const actions = actionsFor(status);

    if (actions.length === 0) return null;

    return (
        <Card>
            <section className="px-5 py-4">
                <h2 className="text-xs font-semibold tracking-widest text-muted uppercase">
                    O que pode acontecer daqui
                </h2>

                <ul className="mt-3 flex flex-col gap-2 text-sm">
                    {actions.map(action => (
                        <li key={action.to}>
                            <strong className="font-semibold">{action.label}.</strong>{" "}
                            <span className="text-muted">{action.consequence}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </Card>
    );
}

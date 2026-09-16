import { Check, Play, X, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useRevalidator } from "react-router";

import type { IconTone } from "~/components/common/button/ButtonIcon";
import { ApiError } from "~/services/ServiceHttp";
import { changeStatus } from "~/services/ServiceAppointment";
import type { AppointmentResponse, AppointmentStatus } from "~/types/TypeAppointment";
import type { Id } from "~/types/TypeCommon";
import { appointmentSummary } from "~/utils/appointment";
import { formatPlate } from "~/utils/plate";
import { allowedTransitions, STATUS_LABEL } from "~/utils/status";
import { useModal } from "./useModal";
import { useNotification } from "./useNotification";

export type StatusAction = {
    to: AppointmentStatus;
    label: string;
    icon: LucideIcon;
    tone: IconTone;
    /** O que a troca custa. "Não pode ser desfeito" serve para as três e não diz nada. */
    consequence: string;
};

const ACTIONS: Partial<Record<AppointmentStatus, StatusAction>> = {
    EmAndamento: {
        to: "EmAndamento",
        label: "Iniciar serviço",
        icon: Play,
        tone: "primary",
        consequence: "Depois de iniciado, o serviço só pode ser concluído — não volta para agendado."
    },
    Concluido: {
        to: "Concluido",
        label: "Concluir serviço",
        icon: Check,
        tone: "done",
        consequence: "Concluído é estado final: o serviço não volta para em andamento."
    },
    Cancelado: {
        to: "Cancelado",
        label: "Cancelar agendamento",
        icon: X,
        tone: "danger",
        consequence: "A vaga volta a ficar livre para outro serviço, e o agendamento não volta atrás."
    }
};

/** O que dá para fazer com um agendamento neste status. Mesma lista na linha e na ficha. */
export function actionsFor(status: AppointmentStatus): readonly StatusAction[] {
    return allowedTransitions(status)
        .map(to => ACTIONS[to])
        .filter(action => action !== undefined);
}

/**
 * Confirmar, mandar para a API, avisar e recarregar o que está na tela. A recusa da API vira o
 * aviso de erro: quem decide se a transição vale é o backend, e a mensagem dele já vem pronta.
 */
type UseStatusActions = {
    /** Como a confirmação mostra o agendamento. Desenhar é da tela; o padrão é uma linha de texto. */
    summaryOf?: (appointment: AppointmentResponse) => ReactNode;
};

export function useStatusActions({ summaryOf = appointmentSummary }: UseStatusActions = {}) {
    const { confirm } = useModal();
    const { notify } = useNotification();
    const revalidator = useRevalidator();
    const [pending, setPending] = useState<Id | null>(null);

    async function change(appointment: AppointmentResponse, to: AppointmentStatus) {
        const action = ACTIONS[to];
        if (!action) return;

        const confirmed = await confirm({
            title: `${action.label}?`,
            summary: summaryOf(appointment),
            text: action.consequence,
            action: action.label,
            danger: to === "Cancelado"
        });

        if (!confirmed) return;

        setPending(appointment.id);

        try {
            const saved = await changeStatus(appointment.id, to);

            notify(`${formatPlate(saved.placa)} agora está ${STATUS_LABEL[saved.status].toLowerCase()}.`);
            revalidator.revalidate();
        } catch (error) {
            const message = error instanceof ApiError
                ? error.message
                : "Não foi possível mudar o status.";

            notify(message, "error");
        } finally {
            setPending(null);
        }
    }

    // Entre a troca e a lista recarregada, a tela mostra o status velho — e com ele as ações
    // velhas. Clicar ali manda uma transição que o banco já não permite, e a resposta é uma recusa
    // que parece defeito ("não é possível mudar de EmAndamento para Cancelado"). As ações ficam
    // travadas até a lista chegar.
    return { change, busy: pending !== null || revalidator.state === "loading" };
}

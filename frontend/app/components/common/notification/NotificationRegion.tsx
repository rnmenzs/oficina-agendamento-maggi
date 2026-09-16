import { useEffect, useRef } from "react";

import { Notification, type NotificationTone } from "./Notification";

export type NotificationItem = {
    id: number;
    tone: NotificationTone;
    text: string;
};

type NotificationRegionProps = {
    notifications: readonly NotificationItem[];
    onClose: (id: number) => void;
};

// A região fica montada desde o começo, mesmo vazia: o leitor de tela precisa estar observando
// antes de a mensagem chegar. Um elemento com aria-live que só nasce junto com o texto costuma
// não ser anunciado.
// Ela cobre a tela inteira para posicionar os avisos, então não pode capturar clique; quem
// recebe clique é cada aviso.
export function NotificationRegion({ notifications, onClose }: NotificationRegionProps) {
    const region = useRef<HTMLDivElement>(null);

    // Uma janela aberta com showModal() sobe para a camada de topo do navegador, acima de qualquer
    // z-index — um aviso disparado com a janela aberta ficaria atrás do fundo escurecido. A região
    // sobe para a mesma camada, e sobe de novo a cada aviso: a ordem lá é a ordem de entrada, e
    // quem entrou por último fica na frente.
    // O atributo só é posto quando o navegador sabe abrir: sem isso, `[popover]` sem `showPopover`
    // vale display:none, e os avisos sumiriam de vez.
    useEffect(() => {
        const target = region.current;
        if (!target || typeof target.showPopover !== "function") return;

        target.popover = "manual";

        try {
            if (target.matches(":popover-open")) target.hidePopover();
            target.showPopover();
        } catch {
            target.popover = null;
        }
    }, [notifications]);

    return (
        <div
            ref={region}
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 top-auto bottom-0 z-50 m-0 h-auto w-auto
                flex flex-col items-center gap-2 border-0 bg-transparent p-4 sm:items-end"
        >
            {notifications.map(item => (
                <div
                    key={item.id}
                    className="pointer-events-auto w-full max-w-sm transition-all duration-200
                        starting:translate-y-2 starting:opacity-0"
                >
                    <Notification tone={item.tone} onClose={() => onClose(item.id)}>
                        {item.text}
                    </Notification>
                </div>
            ))}
        </div>
    );
}

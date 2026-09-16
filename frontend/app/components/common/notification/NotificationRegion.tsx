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
    return (
        <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center
                gap-2 p-4 sm:items-end"
        >
            {notifications.map(nota => (
                <div
                    key={nota.id}
                    className="pointer-events-auto w-full max-w-sm transition-all duration-200
                        starting:translate-y-2 starting:opacity-0"
                >
                    <Notification tone={nota.tone} onClose={() => onClose(nota.id)}>
                        {nota.text}
                    </Notification>
                </div>
            ))}
        </div>
    );
}

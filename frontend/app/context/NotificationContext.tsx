import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import type { NotificationTone } from "~/components/common/notification/Notification";
import { NotificationRegion, type NotificationItem } from "~/components/common/notification/NotificationRegion";

type Notify = (text: string, tone?: NotificationTone) => void;

export const NotificationContext = createContext<{ notify: Notify } | null>(null);

const DISMISS_AFTER_MS = 6000;

// Quantos avisos ficam na tela ao mesmo tempo. Acima disso o mais antigo sai: uma pilha que cresce
// sem limite cobre a tela e esconde justamente o que acabou de acontecer.
const LIMIT = 3;

// Sucesso e informação somem sozinhos; alerta e erro ficam até alguém fechar. Erro que desaparece
// depois de seis segundos é erro que a pessoa não leu.
const AUTO_DISMISS: Record<NotificationTone, boolean> = {
    success: true,
    info: true,
    warning: false,
    error: false
};

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<readonly NotificationItem[]>([]);
    const lastId = useRef(0);

    // Devolver a mesma lista quando não há o que tirar: o React desiste do render. O relógio dos
    // seis segundos dispara mesmo para aviso já fechado na mão ou expulso pelo limite.
    const dismiss = useCallback((id: number) => {
        setNotifications(current =>
            current.some(item => item.id === id) ? current.filter(item => item.id !== id) : current);
    }, []);

    // Estável entre renders: quem avisa costuma fazer isso de dentro de um efeito, e um `notify`
    // novo a cada render colocaria o efeito em laço.
    const notify = useCallback<Notify>((text, tone = "success") => {
        const id = ++lastId.current;

        setNotifications(current => [...current, { id, tone, text }].slice(-LIMIT));

        if (AUTO_DISMISS[tone]) setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    }, [dismiss]);

    const value = useMemo(() => ({ notify }), [notify]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationRegion notifications={notifications} onClose={dismiss} />
        </NotificationContext.Provider>
    );
}

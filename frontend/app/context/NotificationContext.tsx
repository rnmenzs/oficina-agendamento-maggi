import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import type { NotificationTone } from "~/components/common/notification/Notification";
import { NotificationRegion, type NotificationItem } from "~/components/common/notification/NotificationRegion";

type Avisar = (text: string, tone?: NotificationTone) => void;

export const NotificationContext = createContext<{ avisar: Avisar } | null>(null);

const SUMICO_EM_MS = 6000;

// Quantos avisos ficam na tela ao mesmo tempo. Acima disso o mais antigo sai: uma pilha que cresce
// sem limite cobre a tela e esconde justamente o que acabou de acontecer.
const LIMITE = 3;

// Sucesso e informação somem sozinhos; alerta e erro ficam até alguém fechar. Erro que desaparece
// depois de seis segundos é erro que a pessoa não leu.
const SOME_SOZINHO: Record<NotificationTone, boolean> = {
    success: true,
    info: true,
    warning: false,
    error: false
};

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<readonly NotificationItem[]>([]);
    const ultimoId = useRef(0);

    // Devolver a mesma lista quando não há o que tirar: o React desiste do render. O relógio dos
    // seis segundos dispara mesmo para aviso já fechado na mão ou expulso pelo limite.
    const fechar = useCallback((id: number) => {
        setNotifications(atuais =>
            atuais.some(nota => nota.id === id) ? atuais.filter(nota => nota.id !== id) : atuais);
    }, []);

    // Estável entre renders: quem avisa costuma fazer isso de dentro de um efeito, e um `avisar`
    // novo a cada render colocaria o efeito em laço.
    const avisar = useCallback<Avisar>((text, tone = "success") => {
        const id = ++ultimoId.current;

        setNotifications(atuais => [...atuais, { id, tone, text }].slice(-LIMITE));

        if (SOME_SOZINHO[tone]) setTimeout(() => fechar(id), SUMICO_EM_MS);
    }, [fechar]);

    const valor = useMemo(() => ({ avisar }), [avisar]);

    return (
        <NotificationContext.Provider value={valor}>
            {children}
            <NotificationRegion notifications={notifications} onClose={fechar} />
        </NotificationContext.Provider>
    );
}

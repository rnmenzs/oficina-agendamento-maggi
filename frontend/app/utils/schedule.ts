import type { AppointmentResponse, ServiceType } from "~/types/TypeAppointment";
import type { Day, Id, Instant } from "~/types/TypeCommon";
import { addDays, fromDay, toDay, workshopParts } from "./date";
import { SERVICE_MINUTES } from "./service";

// As mesmas regras do domínio, do lado de cá: aqui elas não decidem nada, só transformam em ajuda
// o que o backend recusaria depois. Quem manda continua sendo a API.
const OPENS_AT = 8 * 60;
const CLOSES_AT = 18 * 60;
const CLOSES_AT_ON_SATURDAY = 12 * 60;
const AT_THE_SAME_TIME = 3;
const STEP = 30;

export type SlotReason = "já passou" | "veículo ocupado" | "oficina cheia";

export type Slot = {
    /** Início no formato `09:30`, que é o que o campo de hora envia. */
    time: string;
    endsAt: string;
    /** Quantas das três vagas já estão tomadas nesta faixa. */
    taken: number;
    free: boolean;
    reason: SlotReason | null;
};

const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

function asTime(minutes: number): string {
    const hours = String(Math.floor(minutes / 60)).padStart(2, "0");

    return `${hours}:${String(minutes % 60).padStart(2, "0")}`;
}

/** A que horas a oficina fecha naquele dia, ou nada quando ela não abre. */
export function closingOf(day: Day): number | null {
    const weekday = fromDay(day).getDay();

    if (weekday === 0) return null;

    return weekday === 6 ? CLOSES_AT_ON_SATURDAY : CLOSES_AT;
}

export function isOpen(day: Day): boolean {
    return closingOf(day) !== null;
}

// Minutos desde a meia-noite na oficina. O instante vem em UTC da API; quem o traduz é o fuso da
// oficina, e não o do navegador — senão a mesma agenda vista de fora do país sairia deslocada.
function workshopMinutes(instant: Instant): number {
    return minutesOf(workshopParts(instant)[1]);
}

/**
 * As faixas de 30 em 30 dentro do expediente, com a ocupação de cada uma. É o que faz a tela
 * mostrar antes o que dá para escolher, em vez de recusar depois do envio.
 */
export function slotsOfDay(
    day: Day,
    service: ServiceType,
    vehicleId: Id | "",
    appointments: readonly AppointmentResponse[],
    now = new Date()
): readonly Slot[] {
    const closing = closingOf(day);
    if (closing === null) return [];

    const duration = SERVICE_MINUTES[service];

    // Concluído e cancelado não ocupam vaga: é o mesmo critério dos índices parciais do banco.
    const busy = appointments
        .filter(item => item.status === "Agendado" || item.status === "EmAndamento")
        .map(item => ({
            vehicleId: item.veiculoId,
            from: workshopMinutes(item.inicio),
            to: workshopMinutes(item.fim)
        }));

    // Dia inteiro que já passou trava tudo; hoje trava até a hora atual; o futuro não trava nada.
    // A URL é editável, então "ontem" chega aqui mesmo com o calendário só oferecendo daqui em diante.
    const [today, rightNow] = workshopParts(now);
    const passedBy = day < today ? Infinity : day === today ? minutesOf(rightNow) : -1;

    const slots: Slot[] = [];

    for (let start = OPENS_AT; start + duration <= closing; start += STEP) {
        const end = start + duration;
        const crossing = busy.filter(item => start < item.to && end > item.from);

        const reason: SlotReason | null = start < passedBy ? "já passou"
            : crossing.some(item => item.vehicleId === vehicleId) ? "veículo ocupado"
            : crossing.length >= AT_THE_SAME_TIME ? "oficina cheia"
            : null;

        slots.push({
            time: asTime(start),
            endsAt: asTime(end),
            taken: Math.min(crossing.length, AT_THE_SAME_TIME),
            free: reason === null,
            reason
        });
    }

    return slots;
}

/**
 * O primeiro dia que ainda serve para marcar: hoje, se a oficina abre e ainda cabe algum serviço
 * antes de fechar; senão o próximo dia aberto. Às 22h de uma terça, "hoje" não serve para nada.
 */
export function nextOpenDay(now = new Date()): Day {
    const [today, time] = workshopParts(now);
    const rightNow = minutesOf(time);
    let day = today;

    for (let ahead = 0; ahead < 8; ahead++) {
        const closing = closingOf(day);
        const fits = ahead > 0 || (rightNow + SERVICE_MINUTES.TrocaOleo <= (closing ?? 0));

        if (closing !== null && fits) return day;

        day = toDay(addDays(fromDay(day), 1));
    }

    return day;
}

export { AT_THE_SAME_TIME, minutesOf };

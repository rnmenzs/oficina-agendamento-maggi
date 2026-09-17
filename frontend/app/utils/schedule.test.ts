import { describe, expect, it } from "vitest";
import type { AppointmentResponse, AppointmentStatus, ServiceType } from "~/types/TypeAppointment";
import { instantOf } from "./date";
import { AT_THE_SAME_TIME, closingOf, isOpen, minutesOf, slotsOfDay, type Slot } from "./schedule";
import { SERVICE_MINUTES } from "./service";

// Semana de 14/09/2026: segunda a sábado, com o "agora" antes dela para nenhuma faixa ter passado.
const WEDNESDAY = "2026-09-16";
const SATURDAY = "2026-09-19";
const SUNDAY = "2026-09-20";
const BEFORE = new Date("2026-09-01T12:00:00Z");

const CAR = "carro-1";
const OTHER = "carro-2";

let sequence = 0;

function booked(
    time: string,
    service: ServiceType,
    vehicleId = OTHER,
    status: AppointmentStatus = "Agendado",
    day = WEDNESDAY
): AppointmentResponse {
    const inicio = instantOf(day, time);
    const fim = new Date(Date.parse(inicio) + SERVICE_MINUTES[service] * 60_000).toISOString();

    return {
        id: `agendamento-${++sequence}`, veiculoId: vehicleId, placa: "ABC1234", modelo: "Gol", ano: 2020,
        clienteId: "cliente-1", nomeDoCliente: "Ana", inicio, fim, tipoServico: service, status,
        criadoEm: inicio, atualizadoEm: inicio
    };
}

const at = (slots: readonly Slot[], time: string): Slot => {
    const slot = slots.find(item => item.time === time);
    if (!slot) throw new Error(`Não há faixa às ${time}`);

    return slot;
};

describe("expediente", () => {
    it("fecha às 18h de segunda a sexta, ao meio-dia no sábado e não abre no domingo", () => {
        expect(closingOf(WEDNESDAY)).toBe(18 * 60);
        expect(closingOf(SATURDAY)).toBe(12 * 60);
        expect(closingOf(SUNDAY)).toBeNull();

        expect(isOpen(WEDNESDAY)).toBe(true);
        expect(isOpen(SUNDAY)).toBe(false);
    });

    it("lê a hora como minutos desde a meia-noite", () => {
        expect(minutesOf("09:30")).toBe(570);
        expect(minutesOf("00:00")).toBe(0);
    });
});

describe("slotsOfDay", () => {
    it("oferece de 30 em 30 das 8h até a última faixa em que o serviço termina antes de fechar", () => {
        const oilChange = slotsOfDay(WEDNESDAY, "TrocaOleo", "", [], BEFORE);
        const diagnosis = slotsOfDay(WEDNESDAY, "Diagnostico", "", [], BEFORE);

        expect(oilChange).toHaveLength(20);
        expect(oilChange[0]).toMatchObject({ time: "08:00", endsAt: "08:30", free: true, taken: 0, reason: null });
        expect(oilChange.at(-1)).toMatchObject({ time: "17:30", endsAt: "18:00" });

        expect(diagnosis).toHaveLength(18);
        expect(diagnosis.at(-1)).toMatchObject({ time: "16:30", endsAt: "18:00" });
    });

    it("no sábado o expediente vai só até o meio-dia", () => {
        expect(slotsOfDay(SATURDAY, "TrocaOleo", "", [], BEFORE).at(-1)?.time).toBe("11:30");
        expect(slotsOfDay(SATURDAY, "Revisao", "", [], BEFORE).at(-1)?.time).toBe("11:00");
        expect(slotsOfDay(SATURDAY, "Diagnostico", "", [], BEFORE).at(-1)?.time).toBe("10:30");
    });

    it("no domingo não há faixa nenhuma", () => {
        expect(slotsOfDay(SUNDAY, "TrocaOleo", "", [], BEFORE)).toEqual([]);
    });

    it("hoje trava as faixas que já começaram, no relógio da oficina", () => {
        // 13:05 UTC são 10:05 na oficina.
        const slots = slotsOfDay(WEDNESDAY, "TrocaOleo", "", [], new Date("2026-09-16T13:05:00Z"));

        expect(at(slots, "10:00")).toMatchObject({ free: false, reason: "já passou" });
        expect(at(slots, "10:30")).toMatchObject({ free: true, reason: null });
    });

    it("um dia que já passou trava tudo, e o futuro não trava nada", () => {
        const yesterday = slotsOfDay(WEDNESDAY, "TrocaOleo", "", [], new Date("2026-09-17T12:00:00Z"));
        const future = slotsOfDay(WEDNESDAY, "TrocaOleo", "", [], BEFORE);

        expect(yesterday.every(slot => slot.reason === "já passou")).toBe(true);
        expect(future.every(slot => slot.free)).toBe(true);
    });

    it("o mesmo veículo não entra duas vezes no mesmo horário", () => {
        const appointments = [booked("09:00", "Revisao", CAR)];

        const sameCar = slotsOfDay(WEDNESDAY, "TrocaOleo", CAR, appointments, BEFORE);
        const otherCar = slotsOfDay(WEDNESDAY, "TrocaOleo", OTHER, appointments, BEFORE);

        expect(at(sameCar, "09:00")).toMatchObject({ free: false, reason: "veículo ocupado", taken: 1 });
        expect(at(sameCar, "09:30")).toMatchObject({ free: false, reason: "veículo ocupado" });
        expect(at(sameCar, "08:30")).toMatchObject({ free: true });
        expect(at(sameCar, "10:00")).toMatchObject({ free: true });

        expect(at(otherCar, "09:00")).toMatchObject({ free: true, taken: 1 });
    });

    it("um serviço mais longo do mesmo veículo bate no que já existe mesmo começando antes", () => {
        const slots = slotsOfDay(WEDNESDAY, "Revisao", CAR, [booked("09:00", "TrocaOleo", CAR)], BEFORE);

        expect(at(slots, "08:30")).toMatchObject({ free: false, reason: "veículo ocupado" });
        expect(at(slots, "08:00")).toMatchObject({ free: true });
    });

    it("com três serviços ao mesmo tempo a oficina está cheia", () => {
        const appointments = ["a", "b", "c"].map(vehicle => booked("09:00", "TrocaOleo", vehicle));

        const slots = slotsOfDay(WEDNESDAY, "TrocaOleo", "", appointments, BEFORE);

        expect(at(slots, "09:00")).toMatchObject({ free: false, reason: "oficina cheia", taken: AT_THE_SAME_TIME });
        expect(at(slots, "09:30")).toMatchObject({ free: true, taken: 0 });
    });

    it("concluído e cancelado não ocupam vaga", () => {
        const appointments = [
            booked("09:00", "TrocaOleo", "a"),
            booked("09:00", "TrocaOleo", "b", "Concluido"),
            booked("09:00", "TrocaOleo", "c", "Cancelado"),
            booked("09:00", "TrocaOleo", "d", "EmAndamento")
        ];

        expect(at(slotsOfDay(WEDNESDAY, "TrocaOleo", "", appointments, BEFORE), "09:00"))
            .toMatchObject({ free: true, taken: 2 });
    });

    it("três serviços curtos em sequência não fecham a janela de um longo: o que vale é o pico", () => {
        const appointments = [
            booked("08:00", "TrocaOleo", "a"),
            booked("08:30", "TrocaOleo", "b"),
            booked("09:00", "TrocaOleo", "c")
        ];

        expect(at(slotsOfDay(WEDNESDAY, "Diagnostico", "", appointments, BEFORE), "08:00"))
            .toMatchObject({ free: true, taken: 1 });
    });

    it("o pico conta mesmo quando acontece no meio da janela", () => {
        // Dois diagnósticos das 8h às 9h30 e uma troca de óleo às 9h: às 9h há três ao mesmo tempo.
        const appointments = [
            booked("08:00", "Diagnostico", "a"),
            booked("08:00", "Diagnostico", "b"),
            booked("09:00", "TrocaOleo", "c")
        ];

        const slots = slotsOfDay(WEDNESDAY, "Diagnostico", "", appointments, BEFORE);

        expect(at(slots, "08:30")).toMatchObject({ free: false, reason: "oficina cheia" });
        expect(at(slots, "09:30")).toMatchObject({ free: true, taken: 0 });
    });

    it("o motivo mostrado segue a ordem: já passou, veículo ocupado, oficina cheia", () => {
        const appointments = ["a", "b", CAR].map(vehicle => booked("09:00", "TrocaOleo", vehicle));

        const later = slotsOfDay(WEDNESDAY, "TrocaOleo", CAR, appointments, BEFORE);
        const now = slotsOfDay(WEDNESDAY, "TrocaOleo", CAR, appointments, new Date("2026-09-16T12:30:00Z"));

        expect(at(later, "09:00").reason).toBe("veículo ocupado");
        expect(at(now, "09:00").reason).toBe("já passou");
    });
});

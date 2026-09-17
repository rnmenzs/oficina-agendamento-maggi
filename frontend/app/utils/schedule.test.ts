import { describe, expect, it } from "vitest";
import { closingOf, isOpen, minutesOf, slotsOfDay, type Slot } from "./schedule";

// Semana de 14/09/2026: segunda a sábado, com o "agora" antes dela para nenhuma faixa ter passado.
const WEDNESDAY = "2026-09-16";
const SATURDAY = "2026-09-19";
const SUNDAY = "2026-09-20";
const BEFORE = new Date("2026-09-01T12:00:00Z");

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

});

import { describe, expect, it } from "vitest";
import {
    addDays, addMonths, dayOf, formatDay, formatDayLong, formatDayShort, formatDayWithWeekday,
    formatTime, fromDay, instantOf, isDay, monthGrid, monthLabel, toDay, today
} from "./date";

describe("today", () => {
    it("é o dia da oficina, não o do relógio de quem abre a tela", () => {
        // 02:30 UTC ainda são 23:30 do dia anterior na oficina.
        expect(today(new Date("2026-09-17T02:30:00Z"))).toBe("2026-09-16");
        expect(today(new Date("2026-09-17T03:00:00Z"))).toBe("2026-09-17");
    });
});

describe("isDay", () => {
    it("aceita só dias escritos como a URL manda e que existem no calendário", () => {
        expect(isDay("2026-09-16")).toBe(true);
        expect(isDay("2024-02-29")).toBe(true);

        expect(isDay("2026-02-29")).toBe(false);
        expect(isDay("2026-02-31")).toBe(false);
        expect(isDay("2026-13-01")).toBe(false);
        expect(isDay("16/09/2026")).toBe(false);
        expect(isDay("")).toBe(false);
        expect(isDay(null)).toBe(false);
    });
});

describe("fromDay e toDay", () => {
    it("mantêm o dia escrito, sem passar por UTC", () => {
        const date = fromDay("2026-09-16");

        expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 8, 16]);
        expect(toDay(date)).toBe("2026-09-16");
        expect(toDay(new Date(2026, 0, 5))).toBe("2026-01-05");
    });
});

describe("instantOf, dayOf e formatTime", () => {
    it("aplicam o fuso da oficina, e a volta devolve o mesmo dia e hora", () => {
        const instant = instantOf("2026-09-16", "09:00");

        expect(instant).toBe("2026-09-16T12:00:00.000Z");
        expect(dayOf(instant)).toBe("2026-09-16");
        expect(formatTime(instant)).toBe("09:00");
    });

    it("um instante perto da meia-noite em UTC ainda cai no dia da oficina", () => {
        expect(dayOf("2026-09-17T01:00:00+00:00")).toBe("2026-09-16");
        expect(formatTime("2026-09-17T01:00:00+00:00")).toBe("22:00");
    });
});

describe("formatos", () => {
    it("escrevem o dia como cada tela mostra", () => {
        expect(formatDay("2026-09-16")).toBe("16/09/2026");
        expect(formatDayShort("2026-09-16")).toBe("16/09 qua");
        expect(formatDayWithWeekday("2026-09-19")).toBe("sáb, 19/09/2026");
        expect(formatDayLong("2026-09-16")).toBe("quarta-feira, 16 de setembro de 2026");
        expect(monthLabel(new Date(2026, 8, 1))).toBe("setembro de 2026");
    });
});

describe("calendário", () => {
    it("addDays atravessa o mês e o ano", () => {
        expect(toDay(addDays(new Date(2026, 8, 30), 1))).toBe("2026-10-01");
        expect(toDay(addDays(new Date(2026, 0, 1), -1))).toBe("2025-12-31");
    });

    it("addMonths preserva o dia e encolhe quando ele não existe no mês de destino", () => {
        expect(toDay(addMonths(new Date(2026, 0, 31), 1))).toBe("2026-02-28");
        expect(toDay(addMonths(new Date(2026, 2, 15), -1))).toBe("2026-02-15");
        expect(toDay(addMonths(new Date(2026, 11, 10), 1))).toBe("2027-01-10");
    });

    it("monthGrid tem sempre seis semanas de domingo a sábado, com as bordas dos meses vizinhos", () => {
        const september = monthGrid(new Date(2026, 8, 1));
        const february = monthGrid(new Date(2026, 1, 1));

        expect(september).toHaveLength(6);
        expect(september.every(week => week.length === 7)).toBe(true);
        // 1º de setembro de 2026 é terça: a grade começa no domingo anterior, 30/08.
        expect(toDay(september[0]![0]!)).toBe("2026-08-30");
        expect(toDay(september[5]![6]!)).toBe("2026-10-10");

        // Fevereiro de 2026 começa num domingo e cabe em quatro semanas; a grade não encolhe.
        expect(february).toHaveLength(6);
        expect(toDay(february[0]![0]!)).toBe("2026-02-01");
    });
});

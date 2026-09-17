import { describe, expect, it } from "vitest";
import { periodLabel, periodOf, SHORTCUTS, shortcutOf } from "./period";

// Quarta-feira, no meio de uma semana que vai de 13/09 a 19/09.
const WEDNESDAY = new Date(2026, 8, 16);

describe("periodOf", () => {
    it("hoje e amanhã são um dia só; tudo não limita nada", () => {
        expect(periodOf("hoje", WEDNESDAY)).toEqual({ from: "2026-09-16", to: "2026-09-16" });
        expect(periodOf("amanha", WEDNESDAY)).toEqual({ from: "2026-09-17", to: "2026-09-17" });
        expect(periodOf("tudo", WEDNESDAY)).toEqual({ from: "", to: "" });
    });

    it("amanhã atravessa o fim do mês", () => {
        expect(periodOf("amanha", new Date(2026, 8, 30))).toEqual({ from: "2026-10-01", to: "2026-10-01" });
    });

    it("a semana é a do calendário, de domingo a sábado, seja qual for o dia de hoje", () => {
        const week = { from: "2026-09-13", to: "2026-09-19" };

        expect(periodOf("semana", WEDNESDAY)).toEqual(week);
        expect(periodOf("semana", new Date(2026, 8, 13))).toEqual(week);
        expect(periodOf("semana", new Date(2026, 8, 19))).toEqual(week);
        expect(periodOf("semana", new Date(2026, 8, 20))).toEqual({ from: "2026-09-20", to: "2026-09-26" });
    });
});

describe("shortcutOf", () => {
    it("reconhece o atalho de cada período que ele mesmo gera", () => {
        for (const { value } of SHORTCUTS) {
            expect(shortcutOf(periodOf(value, WEDNESDAY), WEDNESDAY)).toBe(value);
        }
    });

    it("não marca atalho nenhum para um período escolhido à mão", () => {
        expect(shortcutOf({ from: "2026-09-16", to: "2026-09-17" }, WEDNESDAY)).toBeNull();
        expect(shortcutOf({ from: "2026-09-25", to: "2026-09-25" }, WEDNESDAY)).toBeNull();
        expect(shortcutOf({ from: "2026-09-16", to: "" }, WEDNESDAY)).toBeNull();
    });
});

describe("periodLabel", () => {
    it("nomeia os atalhos", () => {
        expect(periodLabel(periodOf("tudo", WEDNESDAY), WEDNESDAY)).toBe("Todos os serviços da oficina");
        expect(periodLabel(periodOf("hoje", WEDNESDAY), WEDNESDAY)).toBe("Hoje, quarta-feira, 16 de setembro de 2026");
        expect(periodLabel(periodOf("amanha", WEDNESDAY), WEDNESDAY)).toBe("Amanhã, quinta-feira, 17 de setembro de 2026");
        expect(periodLabel(periodOf("semana", WEDNESDAY), WEDNESDAY)).toBe("Esta semana, de 13/09/2026 a 19/09/2026");
    });

    it("descreve um período escolhido à mão pelo que ele tem", () => {
        expect(periodLabel({ from: "2026-09-25", to: "2026-09-25" }, WEDNESDAY)).toBe("Sexta-feira, 25 de setembro de 2026");
        expect(periodLabel({ from: "2026-10-01", to: "2026-10-05" }, WEDNESDAY)).toBe("De 01/10/2026 a 05/10/2026");
        expect(periodLabel({ from: "2026-10-01", to: "" }, WEDNESDAY)).toBe("A partir de 01/10/2026");
        expect(periodLabel({ from: "", to: "2026-10-05" }, WEDNESDAY)).toBe("Até 05/10/2026");
    });
});

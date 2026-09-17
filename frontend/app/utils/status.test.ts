import { describe, expect, it } from "vitest";
import { allowedTransitions, isStatus, STATUS_LABEL, STATUSES } from "./status";

describe("isStatus", () => {
    it("aceita só os quatro status, com o nome exato que a API usa", () => {
        for (const status of STATUSES) expect(isStatus(status)).toBe(true);

        expect(isStatus("Inexistente")).toBe(false);
        expect(isStatus("agendado")).toBe(false);
        expect(isStatus("")).toBe(false);
    });
});

describe("allowedTransitions", () => {
    it("segue o ciclo do domínio: agendado começa ou cancela, em andamento conclui, e os finais não saem", () => {
        expect(allowedTransitions("Agendado")).toEqual(["EmAndamento", "Cancelado"]);
        expect(allowedTransitions("EmAndamento")).toEqual(["Concluido"]);
        expect(allowedTransitions("Concluido")).toEqual([]);
        expect(allowedTransitions("Cancelado")).toEqual([]);
    });

    it("nunca volta para agendado nem cancela o que já começou", () => {
        for (const status of STATUSES) {
            expect(allowedTransitions(status)).not.toContain("Agendado");
        }

        expect(allowedTransitions("EmAndamento")).not.toContain("Cancelado");
    });
});

describe("STATUS_LABEL", () => {
    it("mostra o nome interno em português, sem vazar o identificador", () => {
        expect(STATUS_LABEL.EmAndamento).toBe("Em andamento");
        expect(STATUS_LABEL.Concluido).toBe("Concluído");
    });
});

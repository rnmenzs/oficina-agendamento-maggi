import { describe, expect, it } from "vitest";
import { isServiceType, SERVICE_MINUTES, SERVICE_TYPES } from "./service";

describe("isServiceType", () => {
    it("aceita só os três serviços do catálogo, com o nome exato que a API usa", () => {
        for (const service of SERVICE_TYPES) expect(isServiceType(service)).toBe(true);

        expect(isServiceType("revisao")).toBe(false);
        expect(isServiceType("Lavagem")).toBe(false);
        expect(isServiceType(null)).toBe(false);
    });
});

describe("SERVICE_MINUTES", () => {
    it("tem a duração fixa de cada serviço", () => {
        expect(SERVICE_MINUTES).toEqual({ TrocaOleo: 30, Revisao: 60, Diagnostico: 90 });
    });
});

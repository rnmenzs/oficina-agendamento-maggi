import { describe, expect, it } from "vitest";
import { formatPlate, isMercosulPlate, normalizePlate } from "./plate";

describe("normalizePlate", () => {
    it("tira o que não é letra ou número, sobe para maiúsculas e corta em sete", () => {
        expect(normalizePlate("abc-1234")).toBe("ABC1234");
        expect(normalizePlate(" abc 1d23 ")).toBe("ABC1D23");
        expect(normalizePlate("ABC1234XYZ")).toBe("ABC1234");
        expect(normalizePlate("")).toBe("");
    });
});

describe("isMercosulPlate", () => {
    it("reconhece o formato Mercosul, e só ele", () => {
        expect(isMercosulPlate("ABC1D23")).toBe(true);
        expect(isMercosulPlate("abc1d23")).toBe(true);

        expect(isMercosulPlate("ABC1234")).toBe(false);
        expect(isMercosulPlate("ABC1D2")).toBe(false);
        expect(isMercosulPlate("AB11D23")).toBe(false);
    });
});

describe("formatPlate", () => {
    it("põe o hífen só na placa antiga, e só quando ela está completa", () => {
        expect(formatPlate("abc1234")).toBe("ABC-1234");
        expect(formatPlate("ABC-1234")).toBe("ABC-1234");
        expect(formatPlate("ABC1D23")).toBe("ABC1D23");
        expect(formatPlate("ABC12")).toBe("ABC12");
        expect(formatPlate("ABC1")).toBe("ABC1");
    });
});

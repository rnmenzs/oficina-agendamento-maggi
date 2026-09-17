import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
    it("guarda só os dígitos, com DDD", () => {
        expect(normalizePhone("(11) 98765-4321")).toBe("11987654321");
        expect(normalizePhone("(11) 3456-7890")).toBe("1134567890");
    });

    it("tira o +55 que o preenchimento automático injeta", () => {
        expect(normalizePhone("+55 11 98765-4321")).toBe("11987654321");
        expect(normalizePhone("+55 (11) 3456-7890")).toBe("1134567890");
    });

    it("não confunde o DDD 55 com o código do país", () => {
        expect(normalizePhone("(55) 99876-5432")).toBe("55998765432");
        expect(normalizePhone("(55) 3456-7890")).toBe("5534567890");
    });

    it("corta o que passa do tamanho do tipo: celular tem 11 dígitos, fixo tem 10", () => {
        expect(normalizePhone("11987654321999")).toBe("11987654321");
        expect(normalizePhone("11345678909")).toBe("1134567890");
    });
});

describe("formatPhone", () => {
    it("celular parte em 5-4 e fixo em 4-4", () => {
        expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
        expect(formatPhone("1134567890")).toBe("(11) 3456-7890");
    });

    it("acompanha a digitação sem remontar o número no meio", () => {
        expect(formatPhone("")).toBe("");
        expect(formatPhone("1")).toBe("(1");
        expect(formatPhone("11")).toBe("(11");
        expect(formatPhone("119")).toBe("(11) 9");
        expect(formatPhone("1198765")).toBe("(11) 98765");
        expect(formatPhone("11987654")).toBe("(11) 98765-4");
        expect(formatPhone("113456")).toBe("(11) 3456");
        expect(formatPhone("1134567")).toBe("(11) 3456-7");
    });

    it("aceita o número já mascarado ou com o código do país", () => {
        expect(formatPhone("(11) 98765-4321")).toBe("(11) 98765-4321");
        expect(formatPhone("+5511987654321")).toBe("(11) 98765-4321");
    });
});

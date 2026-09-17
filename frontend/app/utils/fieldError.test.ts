import { describe, expect, it } from "vitest";
import { fieldErrorOf, fieldOf, type FieldMentions } from "./fieldError";

const MENTIONS: FieldMentions<"email" | "plate"> = [
    [/e-mail/i, "email"],
    [/placa/i, "plate"]
];

describe("fieldOf", () => {
    it("acha o campo que a recusa cita", () => {
        expect(fieldOf("Já existe um cliente com esse e-mail.", MENTIONS)).toBe("email");
        expect(fieldOf("A placa é inválida.", MENTIONS)).toBe("plate");
    });

    it("não aponta campo nenhum quando a recusa não é de campo", () => {
        expect(fieldOf("A oficina já tem 3 serviços nesse horário.", MENTIONS)).toBeNull();
    });

    it("quando a frase cita mais de um campo, vale o primeiro da lista", () => {
        expect(fieldOf("A placa já pertence a um cliente com outro e-mail.", MENTIONS)).toBe("email");
    });
});

describe("fieldErrorOf", () => {
    it("põe a frase inteira embaixo do campo citado", () => {
        expect(fieldErrorOf("A placa é inválida.", MENTIONS)).toEqual({ plate: "A placa é inválida." });
        expect(fieldErrorOf("Sem campo aqui.", MENTIONS)).toBeNull();
    });
});

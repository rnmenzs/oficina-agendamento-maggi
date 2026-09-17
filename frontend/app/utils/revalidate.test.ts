import type { ShouldRevalidateFunctionArgs } from "react-router";
import { describe, expect, it } from "vitest";
import { unlessRefused } from "./revalidate";

const args = (actionResult: unknown, defaultShouldRevalidate = true) =>
    ({ actionResult, defaultShouldRevalidate } as ShouldRevalidateFunctionArgs);

describe("unlessRefused", () => {
    it("não relê a tela quando a ação foi recusada pelo que foi digitado", () => {
        expect(unlessRefused(args({ failure: { message: "Já existe um cliente com esse e-mail." } }))).toBe(false);
    });

    it("segue o padrão do React Router em todo o resto", () => {
        expect(unlessRefused(args({ saved: { id: "1" } }))).toBe(true);
        expect(unlessRefused(args({ saved: { id: "1" } }, false))).toBe(false);
        expect(unlessRefused(args(undefined))).toBe(true);
        expect(unlessRefused(args(null))).toBe(true);
        expect(unlessRefused(args("failure"))).toBe(true);
    });
});

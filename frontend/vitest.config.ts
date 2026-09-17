import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// Só o alias `~`: o plugin do React Router não entra aqui porque não há rota nem servidor nos
// testes, que cobrem as regras puras de `app/utils`.
export default defineConfig({
    plugins: [tsconfigPaths()],
    test: { include: ["app/**/*.test.ts"] }
});

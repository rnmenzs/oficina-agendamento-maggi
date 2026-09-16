import type { Config } from "@react-router/dev/config";

export default {
    // SPA: sem servidor do React Router. Quem busca e envia dados são clientLoader e
    // clientAction, que chamam os services, que chamam a API .NET.
    ssr: false
} satisfies Config;

import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

// Rotas vêm da estrutura de pastas em app/routes. Nenhuma rota declarada à mão.
export default flatRoutes() satisfies RouteConfig;

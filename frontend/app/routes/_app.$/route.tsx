import { Button } from "~/components/common/button/Button";
import { Card } from "~/components/common/card/Card";
import { StateEmpty } from "~/components/common/state/StateEmpty";

export function meta() {
    return [{ title: "Página não encontrada · Oficina Maggi" }];
}

// A rota curinga fica dentro do layout do sistema, e não na raiz: quem caiu num endereço errado
// continua com a navegação à mão, em vez de ficar numa página solta sem saída.
export default function NotFound() {
    return (
        <Card>
            <StateEmpty
                label="Erro 404"
                title="Esta página não existe"
                description="O endereço pode ter mudado, ou o agendamento que você procurava foi removido."
            >
                <Button to="/agendamentos" variant="primary">Ir para a agenda</Button>
            </StateEmpty>
        </Card>
    );
}

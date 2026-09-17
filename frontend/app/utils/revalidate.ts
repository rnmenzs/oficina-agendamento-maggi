import type { ShouldRevalidateFunctionArgs } from "react-router";

const refused = (result: unknown): boolean =>
    typeof result === "object" && result !== null && "failure" in result;

/**
 * Para rotas cuja ação é recusada por causa do que foi digitado — e-mail repetido, placa inválida:
 * nada mudou no servidor, e reler a tela seria buscar o mesmo dado de novo (ou, com a rede fora,
 * falhar de novo e derrubar a tela inteira com a janela aberta).
 *
 * Não serve onde a recusa é sinal de que a tela está velha. A troca de status é o caso: "mudou
 * enquanto esta alteração era processada" e "não é possível mudar de X para Y" dizem que o servidor
 * já está diferente do que a linha mostra — ali a releitura é justamente o remédio.
 */
export function unlessRefused({ actionResult, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs): boolean {
    return refused(actionResult) ? false : defaultShouldRevalidate;
}

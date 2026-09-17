/**
 * Marca a promessa como tratada sem tratá-la: quem a esperar depois (`Await`, `useResolved`)
 * recebe a recusa do mesmo jeito. Sem isto, uma promessa criada no loader e recusada antes de
 * alguém a ler vira "unhandled rejection" no console — e é o que acontece quando o loader lança
 * antes de devolvê-la, por exemplo num 404 do que ele espera de verdade.
 */
export function deferred<T>(promise: Promise<T>): Promise<T> {
    promise.catch(() => undefined);

    return promise;
}

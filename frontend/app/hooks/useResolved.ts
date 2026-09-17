import { useEffect, useState } from "react";

type Resolution<T> =
    | { status: "pending" }
    | { status: "done"; value: T }
    | { status: "failed"; error: unknown };

/**
 * O valor de uma promessa sem suspender: enquanto a nova não responde, devolve o que a anterior
 * respondeu (ou nada, na primeira vez). Para o que deve continuar na tela enquanto outra parte
 * troca — uma fronteira de Suspense já visível que suspende segura o commit inteiro, e a parte
 * que deveria virar esqueleto fica presa junto com ela.
 *
 * `resetOn` é a chave do dado: quando ela muda (outro dia, outro cliente), o valor antigo não
 * serve mais e o hook volta a esperar — é aí que o esqueleto aparece de novo.
 */
export function useResolved<T>(promise: Promise<T>, resetOn?: unknown): T | undefined {
    const [resolution, setResolution] = useState<Resolution<T>>({ status: "pending" });
    const [key, setKey] = useState(resetOn);

    // Estado derivado de prop, no jeito que o React pede: ajusta durante a renderização, e ele
    // renderiza de novo antes de pintar.
    if (key !== resetOn) {
        setKey(resetOn);
        setResolution({ status: "pending" });
    }

    useEffect(() => {
        let current = true;

        promise.then(
            value => { if (current) setResolution({ status: "done", value }); },
            error => { if (current) setResolution({ status: "failed", error }); }
        );

        return () => { current = false; };
    }, [promise]);

    // Recusa sobe para o ErrorBoundary da rota, como faria o Await.
    if (resolution.status === "failed") throw resolution.error;

    return resolution.status === "done" ? resolution.value : undefined;
}

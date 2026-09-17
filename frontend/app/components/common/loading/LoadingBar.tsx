type LoadingBarProps = {
    active: boolean;
};

// Fixa no topo, por cima de tudo, e some por opacidade em vez de sair do DOM: uma navegação de
// 50 ms mal chega a aparecer, e uma longa não pisca ao começar. Sem valor: o sistema não sabe
// quanto falta, e uma barra que finge saber engana.
export function LoadingBar({ active }: LoadingBarProps) {
    return (
        <div
            role="progressbar"
            aria-label="Carregando"
            aria-hidden={!active}
            style={{ top: "env(safe-area-inset-top, 0px)" }}
            className={`pointer-events-none fixed inset-x-0 z-50 h-0.5 overflow-hidden
                transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
        >
            {/* A animação só existe enquanto a barra está visível: invisível e animando, ela ainda
                custaria repintura a cada quadro. */}
            <div
                className={`h-full w-1/3 bg-primary motion-reduce:w-full
                    ${active ? "animate-slide motion-reduce:animate-none" : ""}`}
            />
        </div>
    );
}

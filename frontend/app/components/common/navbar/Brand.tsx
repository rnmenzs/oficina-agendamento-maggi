// A marca da oficina, como a barra e a tela de login a escrevem: o nome em destaque e o que ela é
// em letras miúdas, para as duas telas não a desenharem cada uma do seu jeito.
export function Brand() {
    return (
        <span className="flex items-baseline gap-2 text-lg font-bold tracking-tight text-ink">
            Maggi
            <span className="text-xs font-normal tracking-widest text-muted uppercase">
                Oficina
            </span>
        </span>
    );
}

import { useId, useRef, useState, type KeyboardEvent } from "react";

import { useFlipUp } from "~/hooks/useFlipUp";
import { useOutsideClick } from "~/hooks/useOutsideClick";

// A lista mais alta que existe: `max-h-65` mais a folga de `mt-1`.
const ALTURA = 264;

export type FormSelectOption = {
    value: string;
    label: string;
};

type UseFormSelect = {
    options: readonly FormSelectOption[];
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
};

export function useFormSelect({ options, value, defaultValue, onChange }: UseFormSelect) {
    const [internal, setInternal] = useState(defaultValue ?? "");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const box = useRef<HTMLDivElement>(null);
    const id = useId();

    const current = value ?? internal;
    const chosen = options.find(option => option.value === current);

    useOutsideClick(box, open, () => setOpen(false));

    const acima = useFlipUp(box, open, ALTURA);

    function choose(option: FormSelectOption) {
        setInternal(option.value);
        onChange?.(option.value);
        setOpen(false);
    }

    // Abrir posiciona o destaque no que já está escolhido, não no primeiro da lista.
    function toggle() {
        setActive(Math.max(0, options.findIndex(option => option.value === current)));
        setOpen(aberto => !aberto);
    }

    function onKeyDown(event: KeyboardEvent) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();

            if (!open) return toggle();

            // Só move o destaque. Escolher aqui fecharia a lista na primeira seta, e quem usa
            // teclado não conseguiria passar por cima das opções para ver o que existe.
            const passo = event.key === "ArrowDown" ? 1 : -1;

            return setActive(at => (at + passo + options.length) % options.length);
        }

        if (event.key === "Enter" || event.key === " ") {
            if (!open) return;

            event.preventDefault();

            const option = options[active];
            if (option) choose(option);
        }
    }

    return {
        id, box, open, acima, active, current, chosen, choose, toggle, onKeyDown, setActive,
        listId: `${id}-lista`,
        optionId: (at: number) => `${id}-opcao-${at}`
    };
}

import { useId, useRef, useState, type KeyboardEvent } from "react";

import { useOutsideClick } from "~/hooks/useOutsideClick";

export type FormSearchOption = {
    value: string;
    label: string;
    detail?: string;
};

const plain = (text: string) =>
    text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

type UseFormSearch = {
    options: readonly FormSearchOption[];
    defaultValue?: string;
    onChange?: (value: string) => void;
};

export function useFormSearch({ options, defaultValue, onChange }: UseFormSearch) {
    const [chosen, setChosen] = useState(() => options.find(o => o.value === defaultValue) ?? null);
    const [typed, setTyped] = useState("");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const box = useRef<HTMLDivElement>(null);
    const id = useId();

    useOutsideClick(box, open, () => setOpen(false));

    const text = chosen ? chosen.label : typed;
    const needle = plain(chosen ? "" : typed);
    const matches = needle
        ? options.filter(option => plain(`${option.label} ${option.detail ?? ""}`).includes(needle))
        : options;

    function choose(option: FormSearchOption) {
        setChosen(option);
        setTyped("");
        setOpen(false);
        onChange?.(option.value);
    }

    function clear() {
        setChosen(null);
        setTyped("");
        setActive(0);
        onChange?.("");
    }


    function type(value: string) {
        if (chosen) clear();

        setTyped(value);
        setActive(0);
        setOpen(true);
    }

    function onKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") return setOpen(false);

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();

            if (!open) return setOpen(true);

            const step = event.key === "ArrowDown" ? 1 : -1;
            setActive(at => (at + step + matches.length) % matches.length);

            return;
        }

        if (event.key === "Enter" && open) {
            const option = matches[active];

            if (option) {
                event.preventDefault();
                choose(option);
            }
        }
    }

    return {
        id, box, open, active, chosen, text, matches, choose, clear, type, onKeyDown, setActive,
        listId: `${id}-lista`,
        openList: () => setOpen(true)
    };
}

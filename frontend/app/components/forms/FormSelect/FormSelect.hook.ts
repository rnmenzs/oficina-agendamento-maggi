import { useId, useRef, useState, type KeyboardEvent } from "react";

import { useOutsideClick } from "~/hooks/useOutsideClick";

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
    const box = useRef<HTMLDivElement>(null);
    const id = useId();

    const current = value ?? internal;
    const chosen = options.find(option => option.value === current);

    useOutsideClick(box, open, () => setOpen(false));

    function choose(option: FormSelectOption) {
        setInternal(option.value);
        onChange?.(option.value);
        setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

        event.preventDefault();

        if (!open) return setOpen(true);

        const at = options.findIndex(option => option.value === current);
        const next = event.key === "ArrowDown"
            ? Math.min(at + 1, options.length - 1)
            : Math.max(at - 1, 0);

        const option = options[next];
        if (option) choose(option);
    }

    return {
        id, box, open, current, chosen, choose, onKeyDown,
        listId: `${id}-lista`,
        toggle: () => setOpen(aberto => !aberto)
    };
}

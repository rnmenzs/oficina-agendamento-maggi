import { useState, type ChangeEvent } from "react";

import { FormText, type FormTextProps } from "./FormText";

type FormNumberProps = Omit<FormTextProps, "type" | "inputMode" | "value" | "onChange" | "defaultValue"> & {
    defaultValue?: string | number;
    digits?: number;
    onChange?: (value: string) => void;
};

export function FormNumber({ defaultValue = "", digits, onChange, ...rest }: FormNumberProps) {
    const [value, setValue] = useState(String(defaultValue));

    function change(event: ChangeEvent<HTMLInputElement>) {
        const clean = event.target.value.replace(/\D/g, "").slice(0, digits);

        setValue(clean);
        onChange?.(clean);
    }

    return <FormText {...rest} inputMode="numeric" value={value} onChange={change} />;
}

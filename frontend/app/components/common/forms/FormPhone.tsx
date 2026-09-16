import { useState, type ChangeEvent } from "react";

import { formatPhone, normalizePhone } from "~/utils/phone";
import { FormText, type FormTextProps } from "./FormText";

type FormPhoneProps = Omit<FormTextProps, "type" | "inputMode" | "value" | "onChange" | "defaultValue"> & {
    defaultValue?: string;
    onChange?: (digits: string) => void;
};

export function FormPhone({ defaultValue = "", onChange, ...rest }: FormPhoneProps) {
    const [phone, setPhone] = useState(() => formatPhone(defaultValue));

    function change(event: ChangeEvent<HTMLInputElement>) {
        const digits = normalizePhone(event.target.value);

        setPhone(formatPhone(digits));
        onChange?.(digits);
    }

    return (
        <FormText
            {...rest}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="(11) 98765-4321"
            value={phone}
            onChange={change}
        />
    );
}

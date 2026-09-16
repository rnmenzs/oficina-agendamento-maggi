import { useState, type ChangeEvent } from "react";

import { formatPlate, normalizePlate } from "~/utils/plate";
import { FormText, type FormTextProps } from "./FormText";

type FormPlateProps = Omit<FormTextProps, "type" | "value" | "onChange" | "defaultValue"> & {
    defaultValue?: string;
    onChange?: (plate: string) => void;
};

export function FormPlate({ defaultValue = "", onChange, ...rest }: FormPlateProps) {
    const [plate, setPlate] = useState(() => formatPlate(defaultValue));

    function change(event: ChangeEvent<HTMLInputElement>) {
        const clean = normalizePlate(event.target.value);

        setPlate(formatPlate(clean));
        onChange?.(clean);
    }

    return (
        <FormText
            {...rest}
            autoComplete="off"
            spellCheck={false}
            placeholder="ABC1D23"
            value={plate}
            onChange={change}
        />
    );
}

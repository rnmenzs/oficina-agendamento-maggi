import { FormText, type FormTextProps } from "./FormText";

const MAX_LENGTH = 254;

type FormEmailProps = Omit<FormTextProps, "type" | "inputMode" | "maxLength">;

export function FormEmail(props: FormEmailProps) {
    return (
        <FormText
            {...props}
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            maxLength={MAX_LENGTH}
        />
    );
}

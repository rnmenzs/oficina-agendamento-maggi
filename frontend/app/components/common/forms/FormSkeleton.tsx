import { useId } from "react";

import { Skeleton } from "../skeleton/Skeleton";
import { FormField } from "./FormField";

type FormSkeletonProps = {
    label: string;
    wide?: boolean;
};

// O rótulo é de verdade e a caixa tem a altura do campo: quando o campo chega, o formulário não
// muda de forma — só de cor.
export function FormSkeleton({ label, wide }: FormSkeletonProps) {
    const id = useId();

    return (
        <FormField id={id} label={label} group wide={wide}>
            <Skeleton className="min-h-10 w-full" />
        </FormField>
    );
}

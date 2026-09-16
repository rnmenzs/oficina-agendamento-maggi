import type { ReactNode } from "react";

export function ModalBody({ children }: { children: ReactNode }) {
    return <div className="px-5 py-4">{children}</div>;
}

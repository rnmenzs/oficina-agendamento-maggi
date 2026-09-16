import type { ReactNode } from "react";

export function ModalFooter({ children }: { children: ReactNode }) {
    return (
        <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">
            {children}
        </footer>
    );
}

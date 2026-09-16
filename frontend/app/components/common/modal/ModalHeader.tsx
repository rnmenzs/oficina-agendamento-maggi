import { X } from "lucide-react";
import type { ReactNode } from "react";

import { ButtonIcon } from "../button/ButtonIcon";
import { useModalControl } from "./Modal.hook";

type ModalHeaderProps = {
    title: string;
    description?: ReactNode;
};

// A moldura que quase toda janela usa: título, descrição quando ajuda, e a saída. O título também
// é o que nomeia a janela para quem não a vê.
export function ModalHeader({ title, description }: ModalHeaderProps) {
    const { titleId, onClose } = useModalControl();

    return (
        <header className="flex items-start gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
                {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>

            <ButtonIcon label="Fechar" icon={X} size={18} onClick={onClose} />
        </header>
    );
}

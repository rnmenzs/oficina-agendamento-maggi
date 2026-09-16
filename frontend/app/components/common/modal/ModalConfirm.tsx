import type { ReactNode } from "react";

import { Button } from "../button/Button";
import { ModalBody } from "./ModalBody";
import { ModalFooter } from "./ModalFooter";
import { ModalHeader } from "./ModalHeader";

export type Confirmation = {
    title: string;
    /** O que vai mudar, para a pessoa reconhecer antes de confirmar. */
    summary?: ReactNode;
    /** O que a ação custa. "Não pode ser desfeito" serve para tudo e não diz nada. */
    text?: ReactNode;
    action: string;
    danger?: boolean;
};

type ModalConfirmProps = Confirmation & {
    onAnswer: (sim: boolean) => void;
};

export function ModalConfirm({ title, summary, text, action, danger, onAnswer }: ModalConfirmProps) {
    return (
        <>
            <ModalHeader title={title} />

            <ModalBody>
                {summary && <div className="mb-3 text-sm font-medium">{summary}</div>}
                {text && <p className="text-sm text-muted">{text}</p>}
            </ModalBody>

            <ModalFooter>
                <Button onClick={() => onAnswer(false)}>Voltar</Button>
                <Button variant={danger ? "dangerStrong" : "primary"} onClick={() => onAnswer(true)}>
                    {action}
                </Button>
            </ModalFooter>
        </>
    );
}

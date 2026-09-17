import { useState, type FormEvent } from "react";

import { Button } from "../common/button/Button";
import { FormEmail } from "../common/forms/FormEmail";
import { FormPhone } from "../common/forms/FormPhone";
import { FormText } from "../common/forms/FormText";
import { ModalBody } from "../common/modal/ModalBody";
import { ModalFooter } from "../common/modal/ModalFooter";
import { ModalHeader } from "../common/modal/ModalHeader";
import type { CreateClientRequest } from "~/types/TypeClient";
import type { FieldMentions } from "~/utils/fieldError";
import { normalizePhone } from "~/utils/phone";

/** A recusa da API já vem separada por campo, com a frase pronta para aparecer embaixo dele. */
export type ClientFieldErrors = {
    name?: string;
    phone?: string;
    email?: string;
};

export const CLIENT_FIELDS: FieldMentions<keyof ClientFieldErrors> = [
    [/e-?mail/i, "email"],
    [/telefone/i, "phone"],
    [/nome/i, "name"]
];

type ClientFormProps = {
    errors?: ClientFieldErrors;
    sending?: boolean;
    onSubmit: (client: CreateClientRequest) => void;
    onCancel: () => void;
};

// O cadastro vive numa janela, e não numa rota própria: a lista continua atrás, e quem cadastrou
// volta para ela sem navegar duas vezes.
export function ClientForm({ errors, sending, onSubmit, onCancel }: ClientFormProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");

    const ready = name.trim().length > 1 && normalizePhone(phone).length >= 10 && email.includes("@");

    // Um <form> de verdade para o Enter valer em qualquer campo: são três campos, e quem acaba de
    // digitar o e-mail não deveria ter que ir até o botão.
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!ready || sending) return;

        onSubmit({
            nome: name.trim(),
            telefone: normalizePhone(phone),
            email: email.trim()
        });
    }

    return (
        <>
            <ModalHeader title="Novo cliente" description="Depois de cadastrar, você adiciona os veículos dele." />

            <form onSubmit={submit}>
                <ModalBody>
                    {/* Nome ocupa a linha inteira; telefone e e-mail dividem a de baixo. É a forma do
                        dado: o nome é o que identifica, os outros dois são como falar com ele. */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormText
                            label="Nome"
                            placeholder="Ana Souza"
                            required
                            wide
                            error={errors?.name}
                            value={name}
                            onChange={event => setName(event.target.value)}
                        />

                        {/* O campo é não controlado de propósito: ele guarda o texto com máscara e
                            devolve só os dígitos, que é o que a API grava. */}
                        <FormPhone label="Telefone" required error={errors?.phone} onChange={setPhone} />

                        <FormEmail
                            label="E-mail"
                            placeholder="ana.souza@email.com"
                            required
                            error={errors?.email}
                            value={email}
                            onChange={event => setEmail(event.target.value)}
                        />
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button onClick={onCancel}>Voltar</Button>
                    <Button type="submit" variant="primary" disabled={!ready || sending}>
                        {sending ? "Cadastrando…" : "Cadastrar cliente"}
                    </Button>
                </ModalFooter>
            </form>
        </>
    );
}

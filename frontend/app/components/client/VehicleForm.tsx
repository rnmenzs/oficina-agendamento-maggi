import { useState, type FormEvent } from "react";

import { Button } from "../common/button/Button";
import { FormNumber } from "../common/forms/FormNumber";
import { FormPlate } from "../common/forms/FormPlate";
import { FormText } from "../common/forms/FormText";
import { ModalBody } from "../common/modal/ModalBody";
import { ModalFooter } from "../common/modal/ModalFooter";
import { ModalHeader } from "../common/modal/ModalHeader";
import type { CreateVehicleRequest } from "~/types/TypeVehicle";
import { today } from "~/utils/date";
import type { FieldMentions } from "~/utils/fieldError";
import { normalizePlate } from "~/utils/plate";

export type VehicleFieldErrors = {
    plate?: string;
    model?: string;
    year?: string;
};

export const VEHICLE_FIELDS: FieldMentions<keyof VehicleFieldErrors> = [
    [/placa/i, "plate"],
    [/modelo/i, "model"],
    [/ano/i, "year"]
];

// A mesma faixa que o domínio aceita: o ano vai até o que vem, porque concessionária vende
// modelo do ano seguinte. Aparece como dica para a recusa não ser a primeira notícia da regra.
const OLDEST = 1900;
const NEWEST = Number(today().slice(0, 4)) + 1;

type VehicleFormProps = {
    /** De quem é o veículo. Aparece na descrição, para a janela dizer onde ele vai parar. */
    clientName: string;
    errors?: VehicleFieldErrors;
    sending?: boolean;
    onSubmit: (vehicle: CreateVehicleRequest) => void;
    onCancel: () => void;
};

export function VehicleForm({ clientName, errors, sending, onSubmit, onCancel }: VehicleFormProps) {
    const [plate, setPlate] = useState("");
    const [year, setYear] = useState("");
    const [model, setModel] = useState("");

    // O botão não julga o que foi digitado: botão apagado não diz o que está errado, e quem sabe a
    // regra é o domínio. Campo vazio o navegador já segura; o resto volta da API no campo certo.
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (sending) return;

        onSubmit({ placa: normalizePlate(plate), modelo: model.trim(), ano: Number(year) });
    }

    return (
        <>
            <ModalHeader title="Novo veículo" description={`De ${clientName}.`} />

            <form onSubmit={submit}>
                <ModalBody>
                    {/* Placa e ano são curtos e dividem a linha; o modelo ocupa a de baixo inteira,
                        porque "Chevrolet Onix Plus" não cabe em meia. */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormPlate label="Placa" required error={errors?.plate} onChange={setPlate} />

                        <FormNumber
                            label="Ano"
                            placeholder={String(NEWEST - 1)}
                            hint={`De ${OLDEST} a ${NEWEST}.`}
                            required
                            digits={4}
                            error={errors?.year}
                            onChange={setYear}
                        />

                        <FormText
                            label="Modelo"
                            placeholder="Fiat Argo"
                            required
                            wide
                            error={errors?.model}
                            value={model}
                            onChange={event => setModel(event.target.value)}
                        />
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button onClick={onCancel}>Voltar</Button>
                    <Button type="submit" variant="primary" disabled={sending}>
                        {sending ? "Cadastrando…" : "Cadastrar veículo"}
                    </Button>
                </ModalFooter>
            </form>
        </>
    );
}

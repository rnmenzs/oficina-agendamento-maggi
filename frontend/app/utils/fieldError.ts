/**
 * A API recusa campo a campo e a frase dela já está escrita para quem lê; o que muda é onde ela
 * aparece. Casar pelo campo citado põe a recusa embaixo dele, que é onde se procura o que corrigir.
 */
export type FieldMentions<Field extends string> = readonly (readonly [RegExp, Field])[];

/** A recusa embaixo do campo que ela cita, ou nada quando não é de campo nenhum. */
export function fieldErrorOf<Field extends string>(
    message: string,
    mentions: FieldMentions<Field>
): Partial<Record<Field, string>> | null {
    const mentioned = mentions.find(([mention]) => mention.test(message));

    return mentioned ? { [mentioned[1]]: message } as Partial<Record<Field, string>> : null;
}

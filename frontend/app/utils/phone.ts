// O backend guarda só os dígitos, com DDD. A máscara é responsabilidade daqui.
const LANDLINE_DIGITS = 10;
const MOBILE_DIGITS = 11;

// O dígito seguinte ao DDD já diz qual é: celular começa em 9 e tem 11 dígitos, fixo começa em
// 2-8 e tem 10. Mesma distinção da regex do Telefone no domínio.
const isMobile = (digits: string) => digits[2] === "9";

export function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");

    // Preenchimento automático do navegador costuma injetar +55, e número nacional nunca tem 12 ou
    // 13 dígitos: tirar não cria ambiguidade com o DDD 55. Mesma regra do Telefone no domínio.
    const national = digits.length === 12 || digits.length === 13
        ? digits.replace(/^55/, "")
        : digits;

    return national.slice(0, isMobile(national) ? MOBILE_DIGITS : LANDLINE_DIGITS);
}

export function formatPhone(phone: string): string {
    const digits = normalizePhone(phone);

    if (digits.length === 0) return "";

    const area = digits.slice(0, 2);

    if (digits.length <= 2) return `(${area}`;

    // Decidir pelo tipo, e não pelo tamanho, evita a máscara remontar o número no meio da
    // digitação: celular parte em 5-4, fixo em 4-4.
    const at = isMobile(digits) ? 7 : 6;
    const head = digits.slice(2, at);
    const tail = digits.slice(at);

    return tail ? `(${area}) ${head}-${tail}` : `(${area}) ${head}`;
}

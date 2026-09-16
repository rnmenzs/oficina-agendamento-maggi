const OLD_FORMAT = /^[A-Z]{3}\d{4}$/;
const MERCOSUL_FORMAT = /^[A-Z]{3}\d[A-Z]\d{2}$/;

/** Sem hífen e em maiúsculas, que é como o banco guarda. */
export function normalizePlate(plate: string): string {
    return plate.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

export function isMercosulPlate(plate: string): boolean {
    return MERCOSUL_FORMAT.test(normalizePlate(plate));
}

// O hífen só existe no formato antigo, e só aparece quando a placa está completa: antes disso
// não dá para saber qual dos dois formatos a pessoa está digitando.
export function formatPlate(plate: string): string {
    const clean = normalizePlate(plate);

    return OLD_FORMAT.test(clean) ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean;
}

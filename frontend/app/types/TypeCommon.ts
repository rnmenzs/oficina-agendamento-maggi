// Primitivos que atravessam todos os contratos. O backend fala Guid e DateTimeOffset; em JSON
// isso chega como texto, e é assim que tratamos — converter para Date é de quem exibe.

export type Id = string;

/** Instante em ISO 8601 com deslocamento. A API responde sempre em UTC (`+00:00`). */
export type Instant = string;

/** Dia no formato `2026-09-16`, sem hora. É o que os filtros de período enviam. */
export type Day = string;

/** Intervalo de dias. Com as duas pontas vazias não há limite de período. */
export type DayRange = {
    from: Day;
    to: Day;
};

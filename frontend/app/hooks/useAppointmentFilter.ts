import { useSearchParams } from "react-router";

import type { AppointmentFilter, AppointmentStatus } from "~/types/TypeAppointment";
import type { DayRange } from "~/types/TypeCommon";
import { periodLabel, periodOf, shortcutOf, SHORTCUTS, type PeriodShortcut } from "~/utils/period";
import { isStatus } from "~/utils/status";

export const PAGE_SIZES = [10, 20, 50] as const;

const DEFAULT_SHORTCUT: PeriodShortcut = "hoje";

function isShortcut(value: string | null): value is PeriodShortcut {
    return SHORTCUTS.some(shortcut => shortcut.value === value);
}

// O tamanho vem da URL, então precisa ser um dos que oferecemos: sem isto um ?porPagina=5000
// escrito à mão viraria uma consulta que a API recusa.
function readPageSize(search: URLSearchParams): number {
    const chosen = Number(search.get("porPagina"));

    return PAGE_SIZES.find(size => size === chosen) ?? PAGE_SIZES[0];
}

// Página também vem da URL: negativa, o backend recusaria com 400 e a tela cairia no ErrorBoundary.
function readPage(search: URLSearchParams): number {
    return Math.max(1, Math.trunc(Number(search.get("pagina"))) || 1);
}

function readStatus(search: URLSearchParams): AppointmentStatus | "" {
    const status = search.get("status") ?? "";

    return isStatus(status) ? status : "";
}

// O período aparece na URL como atalho (`?periodo=semana`) ou como as duas datas escolhidas no
// calendário. Sem nenhum dos dois a agenda abre no dia de hoje, que é o que se quer ver ao chegar.
// Os nomes dos parâmetros são os da API: traduzi-los aqui obrigaria a traduzir de volta na busca.
function readPeriod(search: URLSearchParams, today: Date): DayRange {
    const shortcut = search.get("periodo");
    if (isShortcut(shortcut)) return periodOf(shortcut, today);

    const from = search.get("dataInicio") ?? "";
    const to = search.get("dataFim") ?? "";

    return from || to ? { from, to } : periodOf(DEFAULT_SHORTCUT, today);
}

/** O filtro que a URL descreve, do jeito que a API pede. Serve ao loader, que não tem hooks. */
export function readAppointmentFilter(search: URLSearchParams, today = new Date()): AppointmentFilter {
    const period = readPeriod(search, today);

    return {
        dataInicio: period.from || undefined,
        dataFim: period.to || undefined,
        status: readStatus(search) || undefined,
        pagina: readPage(search),
        tamanhoDaPagina: readPageSize(search)
    };
}

/**
 * O filtro da agenda mora na URL: recarregar mantém a busca e o link é compartilhável.
 * A tela só lê o que este hook devolve e chama as ações; quem traduz URL em filtro é daqui.
 */
export function useAppointmentFilter() {
    const [search, setSearch] = useSearchParams();
    const today = new Date();
    const period = readPeriod(search, today);

    // Mexer no filtro sempre volta para a primeira página: manter a página anterior deixaria a
    // pessoa numa página que o filtro novo talvez nem tenha.
    function change(fields: Record<string, string>) {
        const next = new URLSearchParams(search);

        for (const [key, value] of Object.entries(fields)) {
            if (value) next.set(key, value); else next.delete(key);
        }

        if (!("pagina" in fields)) next.delete("pagina");

        setSearch(next, { preventScrollReset: true });
    }

    function chooseShortcut(shortcut: PeriodShortcut) {
        change({ periodo: shortcut, dataInicio: "", dataFim: "" });
    }

    // Limpar as duas datas é pedir tudo. Sem este desvio a URL ficaria sem período nenhum e a
    // agenda voltaria sozinha para hoje, logo depois de a pessoa apagar as datas.
    function choosePeriod(range: DayRange) {
        if (!range.from && !range.to) return chooseShortcut("tudo");

        change({ periodo: "", dataInicio: range.from, dataFim: range.to });
    }

    // A tela abre em hoje, sem nada na URL, e hoje também é um filtro: perguntar "há filtro?"
    // deixaria o "Limpar" aceso desde o primeiro segundo, sem nada para desfazer.
    const status = readStatus(search);
    const shortcut = shortcutOf(period, today);

    return {
        period,
        shortcut,
        status,
        isDefault: shortcut === DEFAULT_SHORTCUT && !status,
        description: periodLabel(period, today),
        clear: () => setSearch(new URLSearchParams(), { preventScrollReset: true }),
        chooseShortcut,
        choosePeriod,
        chooseStatus: (value: string) => change({ status: value }),
        choosePage: (page: number) => change({ pagina: String(page) }),
        choosePageSize: (size: number) => change({ porPagina: String(size) })
    };
}

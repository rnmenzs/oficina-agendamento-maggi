import { useSearchParams } from "react-router";

import type { AppointmentFilter, AppointmentStatus } from "~/types/TypeAppointment";
import type { DayRange } from "~/types/TypeCommon";
import { periodLabel, periodOf, shortcutOf, SHORTCUTS, type PeriodShortcut } from "~/utils/period";

export const PAGE_SIZES = [10, 20, 50] as const;

const PADRAO: PeriodShortcut = "hoje";

function ehAtalho(valor: string | null): valor is PeriodShortcut {
    return SHORTCUTS.some(atalho => atalho.value === valor);
}

// O tamanho vem da URL, então precisa ser um dos que oferecemos: sem isto um ?porPagina=5000
// escrito à mão viraria uma consulta que a API recusa.
function lerTamanho(busca: URLSearchParams): number {
    const escolhido = Number(busca.get("porPagina"));

    return PAGE_SIZES.find(tamanho => tamanho === escolhido) ?? PAGE_SIZES[0];
}

// O período aparece na URL como atalho (`?periodo=semana`) ou como as duas datas escolhidas no
// calendário. Sem nenhum dos dois a agenda abre no dia de hoje, que é o que se quer ver ao chegar.
function lerPeriodo(busca: URLSearchParams, hoje: Date): DayRange {
    const atalho = busca.get("periodo");
    if (ehAtalho(atalho)) return periodOf(atalho, hoje);

    const from = busca.get("dataInicio") ?? "";
    const to = busca.get("dataFim") ?? "";

    return from || to ? { from, to } : periodOf(PADRAO, hoje);
}

/** O filtro que a URL descreve, do jeito que a API pede. Serve ao loader, que não tem hooks. */
export function readAppointmentFilter(busca: URLSearchParams, hoje = new Date()): AppointmentFilter {
    const periodo = lerPeriodo(busca, hoje);

    return {
        dataInicio: periodo.from || undefined,
        dataFim: periodo.to || undefined,
        status: (busca.get("status") as AppointmentStatus) || undefined,
        pagina: Number(busca.get("pagina")) || 1,
        tamanhoDaPagina: lerTamanho(busca)
    };
}

/**
 * O filtro da agenda mora na URL: recarregar mantém a busca e o link é compartilhável.
 * A tela só lê o que este hook devolve e chama as ações; quem traduz URL em filtro é daqui.
 */
export function useAppointmentFilter() {
    const [busca, setBusca] = useSearchParams();
    const hoje = new Date();
    const periodo = lerPeriodo(busca, hoje);

    // Mexer no filtro sempre volta para a primeira página: manter a página anterior deixaria a
    // pessoa numa página que o filtro novo talvez nem tenha.
    function trocar(mudanca: Record<string, string>) {
        const proxima = new URLSearchParams(busca);

        for (const [chave, valor] of Object.entries(mudanca)) {
            if (valor) proxima.set(chave, valor); else proxima.delete(chave);
        }

        if (!("pagina" in mudanca)) proxima.delete("pagina");

        setBusca(proxima, { preventScrollReset: true });
    }

    function escolherAtalho(atalho: PeriodShortcut) {
        trocar({ periodo: atalho, dataInicio: "", dataFim: "" });
    }

    // Limpar as duas datas é pedir tudo. Sem este desvio a URL ficaria sem período nenhum e a
    // agenda voltaria sozinha para hoje, logo depois de a pessoa apagar as datas.
    function escolherPeriodo(intervalo: DayRange) {
        if (!intervalo.from && !intervalo.to) return escolherAtalho("tudo");

        trocar({ periodo: "", dataInicio: intervalo.from, dataFim: intervalo.to });
    }

    // A tela abre em hoje, sem nada na URL, e hoje também é um filtro: perguntar "há filtro?"
    // deixaria o "Limpar" aceso desde o primeiro segundo, sem nada para desfazer.
    const status = busca.get("status") ?? "";
    const atalho = shortcutOf(periodo, hoje);

    return {
        periodo,
        atalho,
        status,
        padrao: atalho === PADRAO && !status,
        limpar: () => setBusca(new URLSearchParams(), { preventScrollReset: true }),
        descricao: periodLabel(periodo, hoje),
        escolherAtalho,
        escolherPeriodo,
        escolherStatus: (status: string) => trocar({ status }),
        escolherPagina: (pagina: number) => trocar({ pagina: String(pagina) }),
        escolherTamanho: (tamanho: number) => trocar({ porPagina: String(tamanho) })
    };
}

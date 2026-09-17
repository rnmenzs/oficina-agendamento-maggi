import type {
    AppointmentDetailResponse, AppointmentFilter, AppointmentResponse, AppointmentStatus,
    CreateAppointmentRequest
} from "~/types/TypeAppointment";
import type { Day, Id } from "~/types/TypeCommon";
import type { PageResponse } from "~/types/TypePage";
import { request } from "./ServiceHttp";

// As chaves da busca são as que a API espera, e não as do nosso vocabulário: renomear aqui
// obrigaria a traduzir de volta na URL.
export function list(filter: AppointmentFilter): Promise<PageResponse<AppointmentResponse>> {
    return request("/agendamentos", {
        query: {
            dataInicio: filter.dataInicio,
            dataFim: filter.dataFim,
            status: filter.status,
            clienteId: filter.clienteId,
            ordem: filter.ordem,
            pagina: filter.pagina,
            tamanhoDaPagina: filter.tamanhoDaPagina
        }
    });
}

// Só agendado e em andamento ocupam vaga, e a API filtra um status por vez — daí duas buscas.
const OCCUPYING: readonly AppointmentStatus[] = ["Agendado", "EmAndamento"];

// A API corta o tamanho da página em 50, mesmo pedindo mais. Um dia cheio cabe em três serviços
// simultâneos por faixa, então pode passar de 50 num dia de trinta minutos — por isso o laço:
// parar na primeira página mostraria horário ocupado como livre.
// Teto de páginas: a oficina atende três ao mesmo tempo, então um dia de serviços de trinta
// minutos cabe em ~60 ativos — seis páginas de dez sobra. O limite existe para o total vir do
// servidor: um erro de paginação lá viraria centenas de requisições simultâneas daqui.
const MAX_PAGES = 10;

async function everyPage(filter: AppointmentFilter): Promise<AppointmentResponse[]> {
    const first = await list({ ...filter, pagina: 1 });

    if (first.totalDePaginas <= 1) return [...first.itens];

    const pages = Math.min(first.totalDePaginas, MAX_PAGES);
    const rest = await Promise.all(
        Array.from({ length: pages - 1 }, (_, at) => list({ ...filter, pagina: at + 2 }))
    );

    return [first, ...rest].flatMap(page => page.itens);
}

/** Os agendamentos que ocupam vaga naquele dia — é com eles que a tela monta os horários. */
export async function occupyingOn(day: Day): Promise<AppointmentResponse[]> {
    const lists = await Promise.all(OCCUPYING.map(status =>
        everyPage({ dataInicio: day, dataFim: day, status, pagina: 1, tamanhoDaPagina: 50 })));

    return lists.flat();
}

// O histórico de um cliente sai pronto do servidor: recortado, ordenado e paginado. Montá-lo aqui
// obrigaria a baixar a agenda inteira para separar em memória o que é dele.
export function listOfClient(
    clientId: Id,
    page: number,
    pageSize: number
): Promise<PageResponse<AppointmentResponse>> {
    return list({ clienteId: clientId, ordem: "desc", pagina: page, tamanhoDaPagina: pageSize });
}

export function create(appointment: CreateAppointmentRequest): Promise<AppointmentResponse> {
    return request("/agendamentos", { method: "POST", body: appointment });
}

export function get(id: string): Promise<AppointmentDetailResponse> {
    return request(`/agendamentos/${id}`);
}

// Um endpoint de status para as três ações: o que muda é sempre o mesmo campo, e quais transições
// valem é regra do domínio — a tela oferece, a API decide.
export function changeStatus(id: Id, status: AppointmentStatus): Promise<AppointmentResponse> {
    return request(`/agendamentos/${id}/status`, { method: "PATCH", body: { status } });
}

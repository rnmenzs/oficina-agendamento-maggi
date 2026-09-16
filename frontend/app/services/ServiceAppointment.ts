import type {
    AppointmentDetailResponse, AppointmentFilter, AppointmentResponse
} from "~/types/TypeAppointment";
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
            pagina: filter.pagina,
            tamanhoDaPagina: filter.tamanhoDaPagina
        }
    });
}

export function get(id: string): Promise<AppointmentDetailResponse> {
    return request(`/agendamentos/${id}`);
}

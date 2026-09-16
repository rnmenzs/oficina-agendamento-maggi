import type {
    AppointmentDetailResponse, AppointmentFilter, AppointmentResponse, AppointmentStatus,
    CreateAppointmentRequest
} from "~/types/TypeAppointment";
import type { Id } from "~/types/TypeCommon";
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

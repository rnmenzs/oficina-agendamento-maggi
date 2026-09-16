import type {
    AppointmentDetailResponse, AppointmentFilter, AppointmentResponse
} from "~/types/TypeAppointment";
import type { PageResponse } from "~/types/TypePage";
import { pedir } from "./ServiceHttp";

export function listar(filtro: AppointmentFilter): Promise<PageResponse<AppointmentResponse>> {
    return pedir("/agendamentos", {
        busca: {
            dataInicio: filtro.dataInicio,
            dataFim: filtro.dataFim,
            status: filtro.status,
            pagina: filtro.pagina,
            tamanhoDaPagina: filtro.tamanhoDaPagina
        }
    });
}

export function obter(id: string): Promise<AppointmentDetailResponse> {
    return pedir(`/agendamentos/${id}`);
}

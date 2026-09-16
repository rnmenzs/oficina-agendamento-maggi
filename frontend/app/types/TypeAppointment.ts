import type { Day, Id, Instant } from "./TypeCommon";

// Os valores são exatamente os do enum no domínio e os do CHECK no banco: a API grava e lê por
// eles. As chaves dos objetos também ficam como a API envia — elas são o contrato, não escolha.
export type AppointmentStatus = "Agendado" | "EmAndamento" | "Concluido" | "Cancelado";

export type ServiceType = "TrocaOleo" | "Revisao" | "Diagnostico";

export interface AppointmentResponse {
    id: Id;
    veiculoId: Id;
    placa: string;
    modelo: string;
    clienteId: Id;
    nomeDoCliente: string;
    inicio: Instant;
    fim: Instant;
    tipoServico: ServiceType;
    status: AppointmentStatus;
    criadoEm: Instant;
    atualizadoEm: Instant;
}

// O detalhe é a listagem mais o que só a tela de um agendamento precisa: o ano do veículo e o
// contato do dono, para quem atende saber para quem ligar.
export interface AppointmentDetailResponse extends AppointmentResponse {
    ano: number;
    telefoneDoCliente: string;
    emailDoCliente: string;
}

// O contrato do backend aceita nulo nestes campos para poder responder 400 a cliente malfeito.
// Aqui exigimos: se a tela não tem o dado, ela não envia.
export interface CreateAppointmentRequest {
    veiculoId: Id;
    inicio: Instant;
    tipoServico: ServiceType;
}

export interface ChangeStatusRequest {
    status: AppointmentStatus;
}

/** Os parâmetros da listagem, que também são o que vive na URL da tela. */
export interface AppointmentFilter {
    dataInicio?: Day;
    dataFim?: Day;
    status?: AppointmentStatus;
    pagina: number;
    tamanhoDaPagina: number;
}

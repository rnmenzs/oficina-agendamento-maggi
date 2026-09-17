import type { Day, Id, Instant } from "./TypeCommon";

// Os valores são exatamente os do enum no domínio e os do CHECK no banco: a API grava e lê por
// eles. As chaves dos objetos também ficam como a API envia — elas são o contrato, não escolha.
export type AppointmentStatus = "Agendado" | "EmAndamento" | "Concluido" | "Cancelado";

export type ServiceType = "TrocaOleo" | "Revisao" | "Diagnostico";

export type AppointmentResponse = {
    id: Id;
    veiculoId: Id;
    placa: string;
    modelo: string;
    ano: number;
    clienteId: Id;
    nomeDoCliente: string;
    inicio: Instant;
    fim: Instant;
    tipoServico: ServiceType;
    status: AppointmentStatus;
    criadoEm: Instant;
    atualizadoEm: Instant;
};

// O detalhe é a listagem mais o que só a tela de um agendamento precisa: o ano do veículo e o
// contato do dono, para quem atende saber para quem ligar.
export type AppointmentDetailResponse = AppointmentResponse & {
    telefoneDoCliente: string;
    emailDoCliente: string;
};

// O contrato do backend aceita nulo nestes campos para poder responder 400 a cliente malfeito.
// Aqui exigimos: se a tela não tem o dado, ela não envia.
export type CreateAppointmentRequest = {
    veiculoId: Id;
    inicio: Instant;
    tipoServico: ServiceType;
};

export type ChangeStatusRequest = {
    status: AppointmentStatus;
};

/** Os parâmetros da listagem, que também são o que vive na URL da tela. */
export type AppointmentFilter = {
    dataInicio?: Day;
    dataFim?: Day;
    status?: AppointmentStatus;
    clienteId?: Id;
    /** "desc" é do mais recente para o mais antigo, que é como uma ficha lê o histórico. */
    ordem?: "asc" | "desc";
    pagina: number;
    tamanhoDaPagina: number;
};

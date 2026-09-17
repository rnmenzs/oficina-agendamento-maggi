import { expect, it } from "vitest";
import type { AppointmentResponse } from "~/types/TypeAppointment";
import { appointmentSummary } from "./appointment";

it("resume o agendamento por carro, dono, serviço e hora na oficina", () => {
    const appointment: AppointmentResponse = {
        id: "1", veiculoId: "2", placa: "ABC1234", modelo: "Gol", ano: 2020,
        clienteId: "3", nomeDoCliente: "Ana Souza",
        inicio: "2026-09-16T12:00:00+00:00", fim: "2026-09-16T13:00:00+00:00",
        tipoServico: "Revisao", status: "Agendado",
        criadoEm: "2026-09-10T15:00:00+00:00", atualizadoEm: "2026-09-10T15:00:00+00:00"
    };

    expect(appointmentSummary(appointment)).toBe("Gol · ABC-1234 · Ana Souza · Revisão, 16/09 qua às 09:00");
});

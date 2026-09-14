namespace Oficina.Domain.Enums;

// Os nomes têm de ser exatamente os do CHECK no banco (script 002): a DAL grava e lê pelo nome.
// As transições permitidas entre status não ficam aqui: são comportamento da entidade Agendamento.
public enum StatusAgendamento
{
    Agendado,
    EmAndamento,
    Concluido,
    Cancelado
}

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

public static class StatusAgendamentoExtensions
{
    // O nome do enum é valor interno: é o que o banco grava e o que a API troca. Numa frase para a
    // pessoa vai o rótulo, o mesmo que a interface mostra nos selos — "EmAndamento" numa mensagem
    // de erro é vazamento de código para a tela.
    public static string Rotulo(this StatusAgendamento status) => status switch
    {
        StatusAgendamento.Agendado => "Agendado",
        StatusAgendamento.EmAndamento => "Em andamento",
        StatusAgendamento.Concluido => "Concluído",
        StatusAgendamento.Cancelado => "Cancelado",
        _ => throw new ArgumentOutOfRangeException(nameof(status), status, "Status sem rótulo.")
    };
}

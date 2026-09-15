namespace Oficina.Domain.Enums;

// Enum simples, não classe de enumeração: três valores com um único atributo (duração) não justificam
// mais estrutura. Os nomes têm de ser exatamente os do CHECK no banco (script 002): a DAL grava e lê pelo nome.
public enum TipoServico
{
    TrocaOleo,
    Revisao,
    Diagnostico
}

public static class TipoServicoExtensions
{
    // A duração é regra de negócio, por isso mora no domínio. TimeSpan, e não minutos em int,
    // para o fim do agendamento ser simplesmente inicio + Duracao().
    public static TimeSpan Duracao(this TipoServico tipo) => tipo switch
    {
        TipoServico.TrocaOleo => TimeSpan.FromMinutes(30),
        TipoServico.Revisao => TimeSpan.FromMinutes(60),
        TipoServico.Diagnostico => TimeSpan.FromMinutes(90),
        // Enum aceita qualquer inteiro por cast; um valor fora da lista deve falhar alto, não devolver zero.
        _ => throw new ArgumentOutOfRangeException(nameof(tipo), tipo, "Tipo de serviço desconhecido.")
    };
}

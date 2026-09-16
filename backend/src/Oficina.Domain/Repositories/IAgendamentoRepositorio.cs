using Oficina.Domain.Entities;
using Oficina.Domain.Enums;

namespace Oficina.Domain.Repositories;

public interface IAgendamentoRepositorio
{
    // Devolve já com os dados de exibição para a resposta da criação não exigir uma segunda consulta.
    Task<AgendamentoNaAgenda> AdicionarAsync(Agendamento agendamento, CancellationToken cancellationToken);

    // Não encontrar é resultado possível da consulta, não caso excepcional: por isso não lança.
    // Traz o detalhe completo, e quem só precisa da entidade usa a propriedade dela.
    Task<AgendamentoDetalhado?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken);

    // Só o status muda depois de criado, então não existe um atualizar genérico.
    // O status anterior vai junto porque a gravação só vale se ele ainda for o que estava no banco:
    // entre ler e gravar cabe outra requisição, e sem essa condição a segunda apagaria a primeira.
    Task<AgendamentoNaAgenda> AtualizarStatusAsync(
        Agendamento agendamento,
        StatusAgendamento statusAnterior,
        CancellationToken cancellationToken
    );

    // Para a regra de capacidade. Conta em vez de trazer as linhas, porque a camada de regras
    // só precisa do número. Considera apenas Agendado e EmAndamento: cancelado e concluído não ocupam vaga.
    Task<int> ContarAtivosNoPeriodoAsync(
        DateTimeOffset inicio,
        DateTimeOffset fim,
        CancellationToken cancellationToken
    );

    // Para a regra de sobreposição por veículo, com o mesmo critério de status ativo.
    // A constraint de exclusão do banco continua sendo a garantia sob concorrência; esta consulta
    // existe para a regra viver na camada de regras e recusar antes de tentar gravar.
    Task<bool> ExisteSobreposicaoDoVeiculoAsync(
        Guid veiculoId,
        DateTimeOffset inicio,
        DateTimeOffset fim,
        CancellationToken cancellationToken
    );

    // Filtro e paginação no SQL, nunca em memória. O período chega como faixa meia-aberta de
    // instantes, e não como data: assim a comparação é direta contra a coluna e usa o índice.
    Task<Pagina<AgendamentoNaAgenda>> ListarAsync(
        DateTimeOffset? de,
        DateTimeOffset? ate,
        StatusAgendamento? status,
        int pagina,
        int tamanhoDaPagina,
        CancellationToken cancellationToken
    );
}

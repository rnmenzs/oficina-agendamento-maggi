using Oficina.Domain.Entities;
using Oficina.Domain.Enums;

namespace Oficina.Domain.Repositories;

public interface IAgendamentoRepositorio
{
    // O agendamento que entra tem CriadoEm e AtualizadoEm nulos; o que volta traz os carimbos do banco.
    Task<Agendamento> AdicionarAsync(Agendamento agendamento, CancellationToken cancellationToken);

    // Não encontrar é resultado possível da consulta, não caso excepcional: por isso não lança.
    Task<Agendamento?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken);

    // Só o status muda depois de criado, então não existe um atualizar genérico.
    Task<Agendamento> AtualizarStatusAsync(Agendamento agendamento, CancellationToken cancellationToken);

    // Para a regra de capacidade. Conta em vez de trazer as linhas, porque a camada de regras
    // só precisa do número. Considera apenas Agendado e EmAndamento: cancelado e concluído não ocupam vaga.
    Task<int> ContarAtivosNoPeriodoAsync(
        DateTimeOffset inicio,
        DateTimeOffset fim,
        CancellationToken cancellationToken
    );

    // Para a regra de sobreposição por veículo, com o mesmo critério de status ativo.
    Task<bool> ExisteSobreposicaoDoVeiculoAsync(
        Guid veiculoId,
        DateTimeOffset inicio,
        DateTimeOffset fim,
        CancellationToken cancellationToken
    );

    // Filtro e paginação no SQL, nunca em memória.
    Task<Pagina<Agendamento>> ListarAsync(
        DateOnly? data,
        StatusAgendamento? status,
        int pagina,
        int tamanhoDaPagina,
        CancellationToken cancellationToken
    );
}

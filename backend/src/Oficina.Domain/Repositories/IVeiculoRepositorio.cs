using Oficina.Domain.Entities;

namespace Oficina.Domain.Repositories;

public interface IVeiculoRepositorio
{
    // O veículo que entra tem CriadoEm e AtualizadoEm nulos; o que volta traz os carimbos que o banco gerou.
    // A unicidade da placa é do banco: quem implementa traduz a violação em ConflitoException.
    Task<Veiculo> AdicionarAsync(Veiculo veiculo, CancellationToken cancellationToken);

    // Não encontrar é resultado possível da consulta, não caso excepcional: por isso não lança.
    Task<Veiculo?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken);

    Task<IReadOnlyList<Veiculo>> ListarAsync(CancellationToken cancellationToken);

    // Consulta própria, e não a listagem geral filtrada em memória: o índice ix_veiculos_cliente_id
    // existe para isso, e trazer a tabela inteira para descartar quase tudo é desperdício.
    Task<IReadOnlyList<Veiculo>> ListarPorClienteAsync(Guid clienteId, CancellationToken cancellationToken);
}

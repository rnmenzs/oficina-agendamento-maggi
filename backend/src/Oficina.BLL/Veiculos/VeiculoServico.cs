using Oficina.Domain.Entities;
using Oficina.Domain.Exceptions;
using Oficina.Domain.Repositories;
using Oficina.DTO.Veiculos;

namespace Oficina.BLL.Veiculos;

public sealed class VeiculoServico
{
    private readonly IVeiculoRepositorio _veiculos;
    private readonly IClienteRepositorio _clientes;

    public VeiculoServico(IVeiculoRepositorio veiculos, IClienteRepositorio clientes)
    {
        _veiculos = veiculos;
        _clientes = clientes;
    }

    public async Task<VeiculoResponse> CriarAsync(
        Guid clienteId,
        CriarVeiculoRequest request,
        CancellationToken cancellationToken
    )
    {
        // Antes de montar a entidade: sem o dono, a chave estrangeira estouraria com erro cru,
        // e o 404 do cliente inexistente deve ganhar do 400 de dado inválido.
        await GarantirQueOClienteExiste(clienteId, cancellationToken);

        var veiculo = Veiculo.Criar(clienteId, request.Placa, request.Modelo, request.Ano);

        var salvo = await _veiculos.AdicionarAsync(veiculo, cancellationToken);

        return Mapear(salvo);
    }

    public async Task<IReadOnlyList<VeiculoResponse>> ListarPorClienteAsync(
        Guid clienteId,
        CancellationToken cancellationToken
    )
    {
        // Lista vazia diria que o cliente existe e não tem carro, que é diferente de não existir.
        await GarantirQueOClienteExiste(clienteId, cancellationToken);

        var veiculos = await _veiculos.ListarPorClienteAsync(clienteId, cancellationToken);

        return veiculos.Select(Mapear).ToList();
    }

    public async Task<IReadOnlyList<VeiculoResponse>> ListarAsync(CancellationToken cancellationToken)
    {
        var veiculos = await _veiculos.ListarAsync(cancellationToken);

        return veiculos.Select(Mapear).ToList();
    }

    private async Task GarantirQueOClienteExiste(Guid clienteId, CancellationToken cancellationToken)
    {
        if (await _clientes.ObterPorIdAsync(clienteId, cancellationToken) is null)
        {
            throw new NaoEncontradoException("Cliente não encontrado.");
        }
    }

    // Os carimbos só são nulos antes de gravar, e todo veículo que chega aqui já veio do banco.
    private static VeiculoResponse Mapear(Veiculo veiculo)
    {
        return new VeiculoResponse(
            veiculo.Id,
            veiculo.ClienteId,
            veiculo.Placa.Valor,
            veiculo.Modelo,
            veiculo.Ano,
            veiculo.CriadoEm!.Value,
            veiculo.AtualizadoEm!.Value
        );
    }
}

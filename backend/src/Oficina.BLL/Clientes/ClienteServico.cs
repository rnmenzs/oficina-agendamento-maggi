using Oficina.Domain.Entities;
using Oficina.Domain.Exceptions;
using Oficina.Domain.Repositories;
using Oficina.DTO.Clientes;

namespace Oficina.BLL.Clientes;

public sealed class ClienteServico
{
    private readonly IClienteRepositorio _repositorio;

    public ClienteServico(IClienteRepositorio repositorio)
    {
        _repositorio = repositorio;
    }

    public async Task<ClienteResponse> CriarAsync(
        CriarClienteRequest request,
        CancellationToken cancellationToken
    )
    {
        // A entidade valida os três campos; e-mail repetido é recusado pelo banco e chega como ConflitoException.
        var cliente = Cliente.Criar(request.Nome, request.Telefone, request.Email);

        var salvo = await _repositorio.AdicionarAsync(cliente, cancellationToken);

        return Mapear(salvo);
    }

    public async Task<IReadOnlyList<ClienteResponse>> ListarAsync(CancellationToken cancellationToken)
    {
        var clientes = await _repositorio.ListarAsync(cancellationToken);

        return clientes.Select(Mapear).ToList();
    }

    public async Task<ClienteResponse> ObterPorIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var cliente = await _repositorio.ObterPorIdAsync(id, cancellationToken);

        // O repositório devolve nulo porque não achar é resultado possível da consulta.
        // Transformar isso em erro de negócio é decisão desta camada, não da de dados.
        if (cliente is null)
        {
            throw new NaoEncontradoException("Cliente não encontrado.");
        }

        return Mapear(cliente);
    }

    // Os carimbos só são nulos antes de gravar, e todo cliente que chega aqui já veio do banco.
    private static ClienteResponse Mapear(Cliente cliente)
    {
        return new ClienteResponse(
            cliente.Id,
            cliente.Nome,
            cliente.Telefone.Valor,
            cliente.Email.Valor,
            cliente.CriadoEm!.Value,
            cliente.AtualizadoEm!.Value
        );
    }
}

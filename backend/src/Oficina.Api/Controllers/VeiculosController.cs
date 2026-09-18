using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oficina.BLL.Veiculos;
using Oficina.DTO.Veiculos;

namespace Oficina.Api.Controllers;

// Sem [Route] na classe: dois endpoints vivem sob o cliente e um é solto, então cada ação traz a sua rota.
[Authorize]
[ApiController]
public sealed class VeiculosController : ControllerBase
{
    private readonly VeiculoServico _servico;

    public VeiculosController(VeiculoServico servico)
    {
        _servico = servico;
    }

    [HttpPost("api/clientes/{clienteId:guid}/veiculos")]
    [ProducesResponseType(typeof(VeiculoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<VeiculoResponse>> Criar(
        Guid clienteId,
        CriarVeiculoRequest request,
        CancellationToken cancellationToken
    )
    {
        var veiculo = await _servico.CriarAsync(clienteId, request, cancellationToken);

        // 201 sem Location: o cabeçalho deve apontar para o recurso criado, e não existe
        // endpoint de veículo por id. Apontar para a coleção seria mentir sobre o que foi criado.
        return StatusCode(StatusCodes.Status201Created, veiculo);
    }

    [HttpGet("api/clientes/{clienteId:guid}/veiculos")]
    [ProducesResponseType(typeof(IReadOnlyList<VeiculoResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<VeiculoResponse>>> ListarPorCliente(
        Guid clienteId,
        CancellationToken cancellationToken
    )
    {
        return Ok(await _servico.ListarPorClienteAsync(clienteId, cancellationToken));
    }

    [HttpGet("api/veiculos")]
    [ProducesResponseType(typeof(IReadOnlyList<VeiculoResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<VeiculoResponse>>> Listar(CancellationToken cancellationToken)
    {
        return Ok(await _servico.ListarAsync(cancellationToken));
    }
}

using Microsoft.AspNetCore.Mvc;
using Oficina.BLL.Clientes;
using Oficina.DTO.Clientes;

namespace Oficina.Api.Controllers;

[ApiController]
[Route("api/clientes")]
public sealed class ClientesController : ControllerBase
{
    private readonly ClienteServico _servico;

    public ClientesController(ClienteServico servico)
    {
        _servico = servico;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ClienteResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ClienteResponse>> Criar(
        CriarClienteRequest request,
        CancellationToken cancellationToken
    )
    {
        var cliente = await _servico.CriarAsync(request, cancellationToken);

        return CreatedAtAction(nameof(ObterPorId), new { id = cliente.Id }, cliente);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ClienteResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ClienteResponse>>> Listar(CancellationToken cancellationToken)
    {
        return Ok(await _servico.ListarAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ClienteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClienteResponse>> ObterPorId(Guid id, CancellationToken cancellationToken)
    {
        var cliente = await _servico.ObterPorIdAsync(id, cancellationToken);

        if (cliente is null)
        {
            return Problem(
                detail: "Cliente não encontrado.",
                statusCode: StatusCodes.Status404NotFound,
                title: "Não encontrado"
            );
        }

        return Ok(cliente);
    }
}

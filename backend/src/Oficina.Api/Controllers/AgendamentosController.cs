using Microsoft.AspNetCore.Mvc;
using Oficina.BLL.Agendamentos;
using Oficina.DTO;
using Oficina.DTO.Agendamentos;

namespace Oficina.Api.Controllers;

[ApiController]
[Route("api/agendamentos")]
public sealed class AgendamentosController : ControllerBase
{
    private readonly AgendamentoServico _servico;

    public AgendamentosController(AgendamentoServico servico)
    {
        _servico = servico;
    }

    [HttpPost]
    [ProducesResponseType(typeof(AgendamentoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AgendamentoResponse>> Criar(
        CriarAgendamentoRequest request,
        CancellationToken cancellationToken
    )
    {
        var agendamento = await _servico.CriarAsync(request, cancellationToken);

        // Aqui o Location aponta para o próprio recurso criado, ao contrário de veículo,
        // que não tem endpoint por id.
        return CreatedAtAction(nameof(ObterPorId), new { id = agendamento.Id }, agendamento);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AgendamentoDetalheResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AgendamentoDetalheResponse>> ObterPorId(
        Guid id,
        CancellationToken cancellationToken
    )
    {
        return Ok(await _servico.ObterPorIdAsync(id, cancellationToken));
    }

    // Um endpoint de status em vez de três rotas de ação: o que muda é sempre o mesmo campo,
    // e PATCH é exatamente alteração parcial. Quais transições valem é regra do domínio.
    // O 409 é a guarda de concorrência: a gravação confere o status lido, e se outra requisição
    // o mudou no meio, é conflito — o Swagger tem que contar isso a quem integra.
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(AgendamentoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AgendamentoResponse>> AlterarStatus(
        Guid id,
        AlterarStatusRequest request,
        CancellationToken cancellationToken
    )
    {
        return Ok(await _servico.AlterarStatusAsync(id, request, cancellationToken));
    }

    // Os valores padrão ficam na assinatura para o Swagger documentá-los; os limites são do serviço.
    [HttpGet]
    [ProducesResponseType(typeof(PaginaResponse<AgendamentoResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PaginaResponse<AgendamentoResponse>>> Listar(
        CancellationToken cancellationToken,
        [FromQuery] DateOnly? dataInicio = null,
        [FromQuery] DateOnly? dataFim = null,
        [FromQuery] string? status = null,
        [FromQuery] Guid? clienteId = null,
        [FromQuery] string? ordem = null,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanhoDaPagina = 20
    )
    {
        return Ok(await _servico.ListarAsync(
            dataInicio,
            dataFim,
            status,
            clienteId,
            ordem,
            pagina,
            tamanhoDaPagina,
            cancellationToken
        ));
    }
}

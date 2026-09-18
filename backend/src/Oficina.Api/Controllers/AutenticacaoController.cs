using Microsoft.AspNetCore.Mvc;
using Oficina.Api.Auth;
using Oficina.BLL.Autenticacao;
using Oficina.DTO.Auth;

namespace Oficina.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AutenticacaoController : ControllerBase
{
    private readonly AutenticacaoServico _servico;
    private readonly GeradorDeToken _gerador;

    public AutenticacaoController(AutenticacaoServico servico, GeradorDeToken gerador)
    {
        _servico = servico;
        _gerador = gerador;
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var usuario = await _servico.AutenticarAsync(request.Usuario, request.Senha, cancellationToken);

        // Uma frase só para login e senha: dizer qual dos dois errou é contar quais logins existem.
        if (usuario is null)
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Não autorizado",
                detail: "Usuário ou senha inválidos."
            );
        }

        return Ok(new LoginResponse(_gerador.Gerar(usuario.Login)));
    }
}

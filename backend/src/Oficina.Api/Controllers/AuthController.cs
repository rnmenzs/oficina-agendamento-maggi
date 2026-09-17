using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oficina.Api.Auth;
using Oficina.Domain.Repositories;
using Oficina.DTO.Auth;
using BCrypt.Net;

namespace Oficina.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly TokenService _tokenService;
    private readonly IUsuarioRepositorio _repositorio;

    public AuthController(TokenService tokenService, IUsuarioRepositorio repositorio)
    {
        _tokenService = tokenService;
        _repositorio = repositorio;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var usuario = await _repositorio.ObterPorLoginAsync(request.Usuario, cancellationToken);

        if (usuario is null || !BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash))
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Não autorizado",
                detail: "Usuário ou senha inválidos."
            );
        }

        var token = _tokenService.GerarToken(usuario.Login);

        return Ok(new LoginResponse(token));
    }
}

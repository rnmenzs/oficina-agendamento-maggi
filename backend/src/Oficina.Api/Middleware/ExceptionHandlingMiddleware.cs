using Microsoft.AspNetCore.Mvc.Infrastructure;
using Oficina.Domain.Exceptions;

namespace Oficina.Api.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _proximo;
    private readonly ILogger<ExceptionHandlingMiddleware> _log;

    public ExceptionHandlingMiddleware(RequestDelegate proximo, ILogger<ExceptionHandlingMiddleware> log)
    {
        _proximo = proximo;
        _log = log;
    }

    public async Task InvokeAsync(HttpContext contexto)
    {
        try
        {
            await _proximo(contexto);
        }
        // ConflitoException herda de DomainException, então tem de ser capturada antes.
        catch (ConflitoException excecao)
        {
            await Responder(contexto, StatusCodes.Status409Conflict, "Conflito", excecao.Message);
        }
        catch (DomainException excecao)
        {
            await Responder(contexto, StatusCodes.Status400BadRequest, "Dados inválidos", excecao.Message);
        }
        catch (Exception excecao)
        {
            _log.LogError(
                excecao,
                "Erro não tratado em {Metodo} {Caminho}",
                contexto.Request.Method,
                contexto.Request.Path
            );

            // Mensagem genérica: detalhe de erro inesperado fica no log, não na resposta.
            await Responder(
                contexto,
                StatusCodes.Status500InternalServerError,
                "Erro interno",
                "Ocorreu um erro inesperado. Informe o traceId ao suporte."
            );
        }
    }

    private static async Task Responder(HttpContext contexto, int status, string titulo, string detalhe)
    {
        // Se a resposta já começou a ser enviada, não há como trocar o status nem o corpo.
        if (contexto.Response.HasStarted)
        {
            return;
        }

        // Mesma fábrica que o ControllerBase.Problem() usa, para os erros do middleware e os do
        // controller saírem com o mesmo formato, incluindo o campo type e o traceId.
        var fabrica = contexto.RequestServices.GetRequiredService<ProblemDetailsFactory>();
        var problema = fabrica.CreateProblemDetails(contexto, status, titulo, detail: detalhe);

        contexto.Response.StatusCode = status;
        contexto.Response.ContentType = "application/problem+json";

        await contexto.Response.WriteAsJsonAsync(problema);
    }
}

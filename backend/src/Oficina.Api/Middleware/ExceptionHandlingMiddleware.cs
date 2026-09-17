using System.Diagnostics;
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
        // ConflitoException e NaoEncontradoException herdam de DomainException, então vêm antes.
        catch (ConflitoException excecao)
        {
            await Responder(contexto, StatusCodes.Status409Conflict, "Conflito", excecao.Message);
        }
        catch (NaoEncontradoException excecao)
        {
            await Responder(contexto, StatusCodes.Status404NotFound, "Não encontrado", excecao.Message);
        }
        catch (DomainException excecao)
        {
            await Responder(contexto, StatusCodes.Status400BadRequest, "Dados inválidos", excecao.Message);
        }
        // Cliente abortou a requisição: a conexão já morreu, então não há resposta a escrever
        // nem erro a registrar. Sem isso, cada aba fechada viraria um 500 falso nas métricas.
        catch (OperationCanceledException) when (contexto.RequestAborted.IsCancellationRequested)
        {
            _log.LogDebug(
                "Requisição cancelada pelo cliente em {Metodo} {Caminho}",
                contexto.Request.Method,
                contexto.Request.Path
            );
        }
        catch (Exception excecao)
        {
            // O mesmo traceId que vai na resposta: sem ele no log, o identificador que pedimos ao
            // usuário não encontra nada, e a mensagem abaixo seria uma promessa vazia.
            _log.LogError(
                excecao,
                "Erro não tratado em {Metodo} {Caminho} com traceId {TraceId}",
                contexto.Request.Method,
                contexto.Request.Path,
                Activity.Current?.Id ?? contexto.TraceIdentifier
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

        // O tipo vai na própria escrita: WriteAsJsonAsync sem ele sobrescreve o ContentType da
        // resposta com application/json — e as recusas saíam com o tipo errado desde o início.
        await contexto.Response.WriteAsJsonAsync(
            problema,
            options: null,
            contentType: "application/problem+json",
            cancellationToken: contexto.RequestAborted
        );
    }
}

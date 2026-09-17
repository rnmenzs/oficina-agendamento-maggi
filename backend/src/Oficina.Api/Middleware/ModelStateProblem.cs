using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Oficina.Api.Middleware;

// O [ApiController] responde ao binding inválido — JSON malformado, ?dataInicio=not-a-date — antes
// de a requisição chegar ao middleware, e responde no formato dele: ValidationProblemDetails com
// "One or more validation errors occurred." e um campo `errors`. O frontend, sem `detail`, mostrava
// esse título em inglês. Aqui a resposta vira o mesmo ProblemDetails que o middleware produz:
// mesmo título, `detail` em português, mesma fábrica.
public static class ModelStateProblem
{
    public static IActionResult Responder(ActionContext contexto)
    {
        var fabrica = contexto.HttpContext.RequestServices.GetRequiredService<ProblemDetailsFactory>();
        var problema = fabrica.CreateProblemDetails(
            contexto.HttpContext,
            StatusCodes.Status400BadRequest,
            "Dados inválidos",
            detail: Descrever(contexto.ModelState)
        );

        return new BadRequestObjectResult(problema)
        {
            ContentTypes = { "application/problem+json" }
        };
    }

    // As mensagens do binding são do framework, em inglês; o que se aproveita delas é só ONDE
    // falhou. Corpo ilegível chega com chave vazia ou "$"; campo de tipo errado chega como caminho
    // JSON ("$.inicio"); parâmetro de query chega pelo próprio nome ("dataInicio").
    private static string Descrever(ModelStateDictionary estado)
    {
        var chaves = estado
            .Where(par => par.Value?.Errors.Count > 0)
            .Select(par => par.Key)
            .ToList();

        if (chaves.Any(chave => chave.Length == 0 || chave == "$"))
        {
            return "O corpo da requisição não é um JSON válido.";
        }

        var campos = chaves
            .Select(chave => chave.StartsWith("$.", StringComparison.Ordinal) ? chave[2..] : chave)
            .Where(campo => !string.Equals(campo, "request", StringComparison.Ordinal))
            .Distinct()
            .ToList();

        return campos.Count == 0
            ? "O corpo da requisição não é um JSON válido."
            : $"Valor inválido em: {string.Join(", ", campos)}.";
    }
}

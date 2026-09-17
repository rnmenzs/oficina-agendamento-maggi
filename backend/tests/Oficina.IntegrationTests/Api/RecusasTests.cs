using System.Net;
using System.Net.Http.Json;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Oficina.DTO.Clientes;
using Oficina.IntegrationTests.Infra;

namespace Oficina.IntegrationTests.Api;

// Toda recusa sai no mesmo formato, com a frase em português — inclusive as que o framework
// produz antes de a requisição chegar ao middleware. As chaves do ModelState de que o
// ModelStateProblem depende mudam entre versões do .NET; é por isso que isto é teste, e não leitura.
[Collection("api")]
public sealed class RecusasTests(ApiDeTeste api)
{
    private const string ProblemJson = "application/problem+json";

    [Theory]
    [InlineData("{\"nome\": \"x\", \"telefone\": \"11999990000\", \"email\": \"a@b.c\"", "JSON malformado")]
    [InlineData("{\"nome\": 123, \"telefone\": \"11999990000\", \"email\": \"a@b.c\"}", "campo de tipo errado")]
    [InlineData("", "corpo vazio")]
    public async Task Binding_invalido_e_recusado_em_portugues_no_formato_padrao(string corpo, string caso)
    {
        var resposta = await api.Cliente.PostAsync(
            "/api/clientes",
            new StringContent(corpo, Encoding.UTF8, "application/json")
        );

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);
        Assert.Equal(ProblemJson, resposta.Content.Headers.ContentType?.MediaType);

        var problema = await resposta.Content.ReadFromJsonAsync<ProblemDetails>();

        Assert.Equal("Dados inválidos", problema!.Title);
        Assert.False(string.IsNullOrWhiteSpace(problema.Detail), caso);
        Assert.DoesNotContain("validation errors", problema.Detail, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("could not be converted", problema.Detail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Parametro_de_consulta_invalido_e_recusado_dizendo_qual()
    {
        var resposta = await api.Cliente.GetAsync("/api/agendamentos?dataInicio=not-a-date");

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);
        Assert.Equal(ProblemJson, resposta.Content.Headers.ContentType?.MediaType);

        var problema = await resposta.Content.ReadFromJsonAsync<ProblemDetails>();

        Assert.Equal("Dados inválidos", problema!.Title);
        Assert.Contains("dataInicio", problema.Detail);
    }

    // As recusas do domínio passam pelo middleware; até 17/09 saíam como application/json, porque
    // o WriteAsJsonAsync sobrescrevia o tipo. O contraste com o binding foi o que entregou o bug.
    [Fact]
    public async Task Recusas_do_dominio_saem_como_problem_json_com_a_frase_em_portugues()
    {
        var cliente = await api.CriarClienteAsync();

        var naoEncontrado = await api.Cliente.GetAsync($"/api/clientes/{Guid.NewGuid()}");
        var repetido = await api.Cliente.PostAsJsonAsync("/api/clientes", new CriarClienteRequest("Outro", "11999990000", cliente.Email));
        var invalido = await api.Cliente.PostAsJsonAsync("/api/clientes", new CriarClienteRequest("", "11999990000", "novo@teste.dev"));

        foreach (var (resposta, status, frase) in new[]
        {
            (naoEncontrado, HttpStatusCode.NotFound, "Cliente não encontrado."),
            (repetido, HttpStatusCode.Conflict, "Já existe um cliente com este e-mail."),
            (invalido, HttpStatusCode.BadRequest, "Nome é obrigatório.")
        })
        {
            Assert.Equal(status, resposta.StatusCode);
            Assert.Equal(ProblemJson, resposta.Content.Headers.ContentType?.MediaType);
            Assert.Equal(frase, (await resposta.Content.ReadFromJsonAsync<ProblemDetails>())!.Detail);
        }
    }
}

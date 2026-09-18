using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Oficina.DTO.Auth;
using Oficina.IntegrationTests.Infra;

namespace Oficina.IntegrationTests.Api;

// O login bate na tabela usuarios de verdade, com o admin que a migration 004 deixa, e confere a
// senha com BCrypt. É o mesmo login que o ApiDeTeste faz para os outros testes.
[Collection("api")]
public sealed class LoginTests(ApiDeTeste api)
{
    // Um cliente sem o Bearer do ApiDeTeste, ou com um token que não foi assinado pela API: os dois
    // têm que bater na porta. É o teste que acusa um [Authorize] que suma de um controller.
    [Theory]
    [InlineData(null, "sem token")]
    [InlineData("nao.e.um.jwt", "token inválido")]
    public async Task Sem_token_valido_a_api_recusa_antes_de_chegar_na_regra(string? token, string caso)
    {
        using var anonimo = api.CreateClient();
        if (token is not null) anonimo.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        foreach (var rota in new[] { "/api/clientes", "/api/agendamentos?pagina=1&tamanhoDaPagina=1", "/api/veiculos" })
        {
            var resposta = await anonimo.GetAsync(rota);

            Assert.True(resposta.StatusCode == HttpStatusCode.Unauthorized, $"{rota} ({caso}): {resposta.StatusCode}");
            Assert.Contains("Bearer", resposta.Headers.WwwAuthenticate.ToString());
        }
    }

    [Fact]
    public async Task Admin_com_a_senha_da_migration_recebe_um_token()
    {
        var resposta = await api.Cliente.PostAsJsonAsync("/api/auth/login", new LoginRequest("admin", "admin"));

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);

        var corpo = await resposta.Content.ReadFromJsonAsync<LoginResponse>();

        // Três partes separadas por ponto: cabeçalho, claims e assinatura de um JWT.
        Assert.Equal(3, corpo!.Token.Split('.').Length);
    }

    [Theory]
    [InlineData("admin", "errada", "senha errada")]
    [InlineData("ninguem", "admin", "login inexistente")]
    public async Task Login_ou_senha_errados_sao_recusados_com_a_mesma_frase(string login, string senha, string caso)
    {
        var resposta = await api.Cliente.PostAsJsonAsync("/api/auth/login", new LoginRequest(login, senha));

        Assert.True(resposta.StatusCode == HttpStatusCode.Unauthorized, caso);
        Assert.Equal("application/problem+json", resposta.Content.Headers.ContentType?.MediaType);

        var problema = await resposta.Content.ReadFromJsonAsync<ProblemDetails>();

        // A mesma frase nos dois casos: dizer qual errou é contar quais logins existem.
        Assert.Equal("Usuário ou senha inválidos.", problema!.Detail);
        Assert.Equal("Não autorizado", problema.Title);
    }
}

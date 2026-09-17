using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Oficina.DTO.Auth;
using Oficina.IntegrationTests.Infra;

namespace Oficina.IntegrationTests.Api;

// O login é o único endpoint que a troca de esquema do ApiDeTeste não alcança: ele bate na tabela
// usuarios de verdade, com o admin que a migration 004 deixa, e confere a senha com BCrypt.
[Collection("api")]
public sealed class LoginTests(ApiDeTeste api)
{
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

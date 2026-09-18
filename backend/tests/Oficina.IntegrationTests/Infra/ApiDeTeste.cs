using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Oficina.DTO.Agendamentos;
using Oficina.DTO.Auth;
using Oficina.DTO.Clientes;
using Oficina.DTO.Veiculos;

namespace Oficina.IntegrationTests.Infra;

// A API de verdade, em memória, sobre o banco de teste. Uma por coleção: os testes que gravam
// dividem o mesmo banco e por isso rodam em sequência, cada um no seu dia, sem se ver.
public sealed class ApiDeTeste : WebApplicationFactory<Program>, IAsyncLifetime
{
    private const string VariavelDaConexao = "CONNECTION_STRING";
    private const string VariavelDoSegredo = "JWT_SECRET";

    // Qualquer valor com 32 caracteres serve: o token só precisa ser emitido e conferido pelo mesmo host.
    private const string SegredoDeTeste = "segredo-dos-testes-de-integracao-da-oficina";

    private BancoDeTeste? _banco;
    private string? _conexaoOriginal;
    private string? _segredoOriginal;

    /// <summary>Cliente já logado como o admin da migration: é o que os testes de regra usam.</summary>
    public HttpClient Cliente { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        _banco = await BancoDeTeste.CriarAsync();

        // O Program.cs lê o ambiente antes do .env, então é aqui que a API é apontada para o banco
        // de teste e ganha um segredo de JWT próprio — antes de o host existir, e sem depender do
        // .env de quem roda. Os valores que estavam lá voltam no fim: o runner da IDE reaproveita o
        // processo entre execuções, e a próxima herdaria uma string apontando para um banco já apagado.
        // Se o host não subir, o xUnit não chama o DisposeAsync — o banco é apagado aqui mesmo.
        try
        {
            _conexaoOriginal = Environment.GetEnvironmentVariable(VariavelDaConexao);
            _segredoOriginal = Environment.GetEnvironmentVariable(VariavelDoSegredo);
            Environment.SetEnvironmentVariable(VariavelDaConexao, _banco.ConnectionString);
            Environment.SetEnvironmentVariable(VariavelDoSegredo, SegredoDeTeste);

            Cliente = CreateClient();
            Cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LogarAsync());
        }
        catch
        {
            RestaurarAmbiente();
            await _banco.DisposeAsync();
            throw;
        }
    }

    // O banco é apagado e a variável restaurada mesmo que o host falhe ao fechar: sem o finally,
    // um erro aí deixaria um oficina_teste_* órfão no servidor a cada execução.
    public new async Task DisposeAsync()
    {
        try
        {
            Cliente.Dispose();
            await base.DisposeAsync();
        }
        finally
        {
            RestaurarAmbiente();
            if (_banco is not null) await _banco.DisposeAsync();
        }
    }

    // O login é de verdade, com o admin que a migration 004 deixa no banco de teste: assim o JWT é
    // emitido e conferido em todos os testes, e um [Authorize] que suma de um controller derruba o
    // teste anônimo do LoginTests em vez de passar despercebido.
    private async Task<string> LogarAsync()
    {
        var resposta = await Cliente.PostAsJsonAsync("/api/auth/login", new LoginRequest("admin", "admin"));
        resposta.EnsureSuccessStatusCode();

        var corpo = await resposta.Content.ReadFromJsonAsync<LoginResponse>();

        return corpo!.Token;
    }

    private void RestaurarAmbiente()
    {
        Environment.SetEnvironmentVariable(VariavelDaConexao, _conexaoOriginal);
        Environment.SetEnvironmentVariable(VariavelDoSegredo, _segredoOriginal);
    }

    // ── Dados de cada teste ────────────────────────────────────────────────

    public async Task<ClienteResponse> CriarClienteAsync()
    {
        var sufixo = Guid.NewGuid().ToString("N")[..8];
        var resposta = await Cliente.PostAsJsonAsync(
            "/api/clientes",
            new CriarClienteRequest($"Cliente {sufixo}", "11999990000", $"{sufixo}@teste.dev")
        );

        resposta.EnsureSuccessStatusCode();

        return (await resposta.Content.ReadFromJsonAsync<ClienteResponse>())!;
    }

    public async Task<VeiculoResponse> CriarVeiculoAsync(Guid clienteId)
    {
        var resposta = await Cliente.PostAsJsonAsync(
            $"/api/clientes/{clienteId}/veiculos",
            new CriarVeiculoRequest(PlacaAleatoria(), "Modelo de teste", 2022)
        );

        resposta.EnsureSuccessStatusCode();

        return (await resposta.Content.ReadFromJsonAsync<VeiculoResponse>())!;
    }

    public async Task<IReadOnlyList<VeiculoResponse>> CriarVeiculosAsync(int quantos)
    {
        var dono = await CriarClienteAsync();
        var veiculos = new List<VeiculoResponse>();

        for (var i = 0; i < quantos; i++) veiculos.Add(await CriarVeiculoAsync(dono.Id));

        return veiculos;
    }

    public Task<HttpResponseMessage> AgendarAsync(Guid veiculoId, DateTimeOffset inicio, string tipo = "TrocaOleo") =>
        Cliente.PostAsJsonAsync("/api/agendamentos", new CriarAgendamentoRequest(veiculoId, inicio, tipo));

    public Task<HttpResponseMessage> MudarStatusAsync(Guid agendamentoId, string status) =>
        Cliente.PatchAsJsonAsync($"/api/agendamentos/{agendamentoId}/status", new AlterarStatusRequest(status));

    // Mercosul, com letras e dígitos aleatórios: única o bastante para nunca colidir num teste.
    private static string PlacaAleatoria()
    {
        const string letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var r = Random.Shared;

        return $"{letras[r.Next(26)]}{letras[r.Next(26)]}{letras[r.Next(26)]}{r.Next(10)}{letras[r.Next(26)]}{r.Next(10)}{r.Next(10)}";
    }
}

[CollectionDefinition("api")]
public sealed class ColecaoDaApi : ICollectionFixture<ApiDeTeste>;

// Dias úteis futuros, no fuso da oficina, um por teste: a capacidade é da oficina inteira, então
// dois testes no mesmo horário do mesmo dia se veriam. Duas semanas à frente para nunca cair no
// passado durante a execução.
public static class Dia
{
    private static readonly TimeSpan FusoDaOficina = TimeSpan.FromHours(-3);

    public static DateTimeOffset UtilAs(int indice, int hora, int minuto = 0)
    {
        var hoje = DateTimeOffset.UtcNow.ToOffset(FusoDaOficina).Date;
        var diasAteSegunda = ((int)DayOfWeek.Monday - (int)hoje.DayOfWeek + 7) % 7;
        var segunda = hoje.AddDays(diasAteSegunda + 14);

        // Índice 0..4 é segunda a sexta da primeira semana; 5..9 a semana seguinte, e assim por diante.
        var dia = segunda.AddDays(indice / 5 * 7 + indice % 5);

        return new DateTimeOffset(dia.Year, dia.Month, dia.Day, hora, minuto, 0, FusoDaOficina);
    }
}

using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Oficina.DTO.Agendamentos;
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

    public HttpClient Cliente { get; private set; } = null!;

    // Os endpoints exigem [Authorize]. Em vez de gerar um JWT para cada teste, o esquema de
    // autenticação é trocado por um que aceita tudo: o que se prova aqui é a regra da API, não o
    // middleware de JWT. O login em si continua real — o LoginTests bate nele com a tabela usuarios.
    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.AddAuthentication(AutenticacaoDeTeste.Esquema)
                .AddScheme<AuthenticationSchemeOptions, AutenticacaoDeTeste>(AutenticacaoDeTeste.Esquema, _ => { });

            services.PostConfigure<AuthenticationOptions>(options =>
            {
                options.DefaultAuthenticateScheme = AutenticacaoDeTeste.Esquema;
                options.DefaultChallengeScheme = AutenticacaoDeTeste.Esquema;
            });
        });
    }

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

// Esquema que aceita qualquer requisição como se viesse de um usuário logado. Registrado no
// ConfigureWebHost do ApiDeTeste no lugar do JWT.
public sealed class AutenticacaoDeTeste(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder
) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string Esquema = "Teste";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var identidade = new ClaimsIdentity([new Claim(ClaimTypes.Name, "teste")], Esquema);
        var bilhete = new AuthenticationTicket(new ClaimsPrincipal(identidade), Esquema);

        return Task.FromResult(AuthenticateResult.Success(bilhete));
    }
}

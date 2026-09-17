using System.Text.RegularExpressions;
using Oficina.Api.Middleware;
using Oficina.BLL.Agendamentos;
using Oficina.BLL.Clientes;
using Oficina.BLL.Veiculos;
using Oficina.DAL.DependencyInjection;

const string FrontendCorsPolicy = "Frontend";

// Carrega variáveis do .env (raiz do repositório) como variáveis de ambiente,
// respeitando a cadeia de prioridade do ASP.NET Core (env vars > appsettings).
// Sobe a partir do diretório atual até encontrar o .env na raiz do repositório.
LoadDotEnv(FindFileUpwards(".env"));

var builder = WebApplication.CreateBuilder(args);

// Connection string vem exclusivamente do .env / variáveis de ambiente.
var connectionString = Environment.GetEnvironmentVariable("CONNECTION_STRING")
    ?? throw new InvalidOperationException(
        "A variável de ambiente CONNECTION_STRING não está definida. "
        + "Copie .env.example para .env na raiz do repositório (cp .env.example .env).");
builder.Configuration["ConnectionStrings:OficinaDb"] = connectionString;

builder.Services.AddDal(connectionString);
// Relógio como dependência: entidades e serviços recebem o instante em vez de lerem sozinhos.
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<ClienteServico>();
builder.Services.AddScoped<VeiculoServico>();
builder.Services.AddScoped<AgendamentoServico>();

// Se CORS_ORIGINS estiver definida, sobrescreve as origens do appsettings.
var corsOriginsOverride = Environment.GetEnvironmentVariable("CORS_ORIGINS");

builder.Services
    .AddControllers()
    .ConfigureApiBehaviorOptions(options =>
        options.InvalidModelStateResponseFactory = ModelStateProblem.Responder);

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
    {
        Title = "Oficina API",
        Version = "v1",
        Description = "Agendamento de serviços em veículos dos clientes de uma oficina mecânica."
    });
});

var allowedOrigins = !string.IsNullOrWhiteSpace(corsOriginsOverride)
    ? corsOriginsOverride.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    : builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

builder.Services.AddCors(options =>
    options.AddPolicy(FrontendCorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

// Primeiro do pipeline: só assim ele enxerga as exceções de tudo que vem depois.
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Swagger ligado em todos os ambientes para facilitar a avaliação da API.
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors(FrontendCorsPolicy);

// Redirect para HTTPS só fora de desenvolvimento e só quando há uma porta HTTPS para onde
// redirecionar: local a API roda em HTTP e um redirect quebraria o preflight de CORS; no
// container ela também só escuta HTTP, e o middleware sem porta avisaria a cada subida.
var httpsPort = Environment.GetEnvironmentVariable("ASPNETCORE_HTTPS_PORTS")
    ?? Environment.GetEnvironmentVariable("HTTPS_PORT");

if (!app.Environment.IsDevelopment() && httpsPort is not null)
{
    app.UseHttpsRedirection();
}

app.MapControllers();

// Onde a API está, na primeira linha do log dela: dentro de um container (a imagem oficial do .NET
// define DOTNET_RUNNING_IN_CONTAINER) ou nesta máquina — e para qual host de banco ela aponta.
// É o que distingue, de fora, um `docker compose up` de um `dotnet run`, sem adivinhar por "/app".
var dentroDeContainer = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";
var hostDoBanco = Regex.Match(connectionString, @"Host=([^;]+)", RegexOptions.IgnoreCase).Groups[1].Value;

app.Logger.LogInformation(
    "Oficina API rodando {Onde}, banco em {Host}",
    dentroDeContainer ? "dentro de um container Docker" : "nesta máquina (fora de container)",
    hostDoBanco
);

app.Run();

// ── Helper ────────────────────────────────────────────────────────────

/// <summary>
/// Lê um arquivo .env e define variáveis de ambiente que ainda não existam.
/// Ignora linhas em branco, comentários (#) e linhas sem '='.
/// Não sobrescreve variáveis já definidas no sistema operacional.
/// </summary>
static void LoadDotEnv(string? path)
{
    if (path is null || !File.Exists(path)) return;

    foreach (var line in File.ReadAllLines(path))
    {
        var trimmed = line.Trim();
        if (trimmed.Length == 0 || trimmed.StartsWith('#')) continue;

        var separatorIndex = trimmed.IndexOf('=');
        if (separatorIndex <= 0) continue;

        var key = trimmed[..separatorIndex].Trim();
        var value = trimmed[(separatorIndex + 1)..].Trim();

        // Não sobrescreve variáveis já definidas (ex.: export no shell tem prioridade).
        if (Environment.GetEnvironmentVariable(key) is null)
        {
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}

/// <summary>
/// Procura um arquivo subindo a árvore de diretórios a partir do diretório atual.
/// Retorna o caminho completo ou null se não encontrar.
/// </summary>
static string? FindFileUpwards(string fileName)
{
    var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
    while (dir is not null)
    {
        var candidate = Path.Combine(dir.FullName, fileName);
        if (File.Exists(candidate)) return candidate;
        dir = dir.Parent;
    }
    return null;
}

// O WebApplicationFactory dos testes de integração precisa de um tipo público para apontar; com
// top-level statements, a classe Program é gerada interna, e esta declaração parcial a expõe.
public partial class Program;

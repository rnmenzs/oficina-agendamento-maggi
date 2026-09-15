using Oficina.Api.Middleware;
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
builder.Services.AddScoped<ClienteServico>();
builder.Services.AddScoped<VeiculoServico>();

// Se CORS_ORIGINS estiver definida, sobrescreve as origens do appsettings.
var corsOriginsOverride = Environment.GetEnvironmentVariable("CORS_ORIGINS");

builder.Services.AddControllers();

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

// Redirect para HTTPS só fora de desenvolvimento: local a API roda em HTTP
// e um redirect quebraria o preflight de CORS vindo do frontend.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.MapControllers();

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

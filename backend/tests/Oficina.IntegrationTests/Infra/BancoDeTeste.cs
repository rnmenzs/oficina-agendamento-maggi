using Npgsql;

namespace Oficina.IntegrationTests.Infra;

// Um banco novo por execução, criado no mesmo servidor do desenvolvimento e apagado no fim: os
// testes gravam de verdade, e o banco de desenvolvimento não pode sentir nada disso. O esquema vem
// dos mesmos scripts que criam o banco real — é o que se quer provar, e não uma cópia deles.
public sealed class BancoDeTeste : IAsyncDisposable
{
    private static readonly string RaizDoRepositorio = EncontrarRaiz();

    public string Nome { get; } = $"oficina_teste_{Guid.NewGuid():N}"[..24];

    public string ConnectionString { get; }

    private readonly string _connectionStringDoServidor;

    private BancoDeTeste()
    {
        var construtor = new NpgsqlConnectionStringBuilder(ConnectionStringDeDesenvolvimento())
        {
            Database = Nome,
            Pooling = false
        };

        ConnectionString = construtor.ConnectionString;

        construtor.Database = "postgres";
        _connectionStringDoServidor = construtor.ConnectionString;
    }

    public static async Task<BancoDeTeste> CriarAsync()
    {
        var banco = new BancoDeTeste();

        try
        {
            await banco.ExecutarNoServidorAsync($"CREATE DATABASE \"{banco.Nome}\"");
        }
        catch (NpgsqlException excecao)
        {
            throw new InvalidOperationException(
                "Os testes de integração precisam do PostgreSQL no ar: docker compose up -d db.",
                excecao
            );
        }

        // Só a estrutura, lida da pasta, em ordem: uma migration nova entra aqui sozinha. Os seeds
        // ficam de fora pelo nome — a convenção da pasta é que dado de teste tem "seed" no nome
        // (003_seed, 004_seed_volume) — porque cada teste cria o que precisa.
        var estrutura = Directory.GetFiles(Path.Combine(RaizDoRepositorio, "scripts"), "*.sql")
            .Where(caminho => !Path.GetFileName(caminho).Contains("seed", StringComparison.OrdinalIgnoreCase))
            .OrderBy(caminho => Path.GetFileName(caminho), StringComparer.Ordinal);

        foreach (var script in estrutura)
        {
            await banco.ExecutarAsync(await File.ReadAllTextAsync(script));
        }

        return banco;
    }

    public async Task ExecutarAsync(string sql)
    {
        await using var conexao = new NpgsqlConnection(ConnectionString);
        await conexao.OpenAsync();
        await using var comando = new NpgsqlCommand(sql, conexao);
        await comando.ExecuteNonQueryAsync();
    }

    public async ValueTask DisposeAsync()
    {
        // FORCE derruba as conexões que a API ainda tiver no pool; sem ele o DROP esperaria por elas.
        NpgsqlConnection.ClearAllPools();
        await ExecutarNoServidorAsync($"DROP DATABASE IF EXISTS \"{Nome}\" WITH (FORCE)");
    }

    private async Task ExecutarNoServidorAsync(string sql)
    {
        await using var conexao = new NpgsqlConnection(_connectionStringDoServidor);
        await conexao.OpenAsync();
        await using var comando = new NpgsqlCommand(sql, conexao);
        await comando.ExecuteNonQueryAsync();
    }

    // O mesmo .env que a API lê, para o servidor ser o do Compose sem configuração à parte.
    // Variável de ambiente ganha do arquivo, como na própria API.
    private static string ConnectionStringDeDesenvolvimento()
    {
        var doAmbiente = Environment.GetEnvironmentVariable("CONNECTION_STRING");
        if (!string.IsNullOrWhiteSpace(doAmbiente)) return doAmbiente;

        var env = Path.Combine(RaizDoRepositorio, ".env");
        var linha = File.Exists(env)
            ? File.ReadAllLines(env).FirstOrDefault(l => l.StartsWith("CONNECTION_STRING=", StringComparison.Ordinal))
            : null;

        return linha?["CONNECTION_STRING=".Length..].Trim()
            ?? throw new InvalidOperationException(
                "Os testes de integração precisam do PostgreSQL: suba o banco (docker compose up -d db) "
                + "e tenha CONNECTION_STRING no .env da raiz ou no ambiente.");
    }

    private static string EncontrarRaiz()
    {
        var pasta = new DirectoryInfo(AppContext.BaseDirectory);

        while (pasta is not null)
        {
            if (File.Exists(Path.Combine(pasta.FullName, "scripts", "001_create_tables.sql"))) return pasta.FullName;
            pasta = pasta.Parent;
        }

        throw new InvalidOperationException("Não achei a pasta scripts/ subindo a partir de " + AppContext.BaseDirectory);
    }
}

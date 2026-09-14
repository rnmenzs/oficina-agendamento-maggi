using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Oficina.DAL.DependencyInjection;

public static class ServiceCollectionExtensions
{
    // Singleton porque a fonte de dados é quem mantém o pool: uma por requisição anularia o pool.
    // Fica na DAL, e não no Program.cs, para o Npgsql não aparecer na camada de API.
    public static IServiceCollection AddDal(this IServiceCollection services, string connectionString)
    {
        services.AddSingleton(_ => NpgsqlDataSource.Create(connectionString));

        return services;
    }
}

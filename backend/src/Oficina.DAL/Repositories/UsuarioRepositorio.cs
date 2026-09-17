using Dapper;
using Npgsql;
using Oficina.Domain.Entities;
using Oficina.Domain.Repositories;

namespace Oficina.DAL.Repositories;

public sealed class UsuarioRepositorio : IUsuarioRepositorio
{
    private readonly NpgsqlDataSource _dataSource;

    public UsuarioRepositorio(NpgsqlDataSource dataSource)
    {
        _dataSource = dataSource;
    }

    public async Task<Usuario?> ObterPorLoginAsync(string login, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT id, login, senha_hash AS SenhaHash, nome
            FROM usuarios
            WHERE login = @Login
            """;

        await using var conexao = await _dataSource.OpenConnectionAsync(cancellationToken);

        return await conexao.QuerySingleOrDefaultAsync<Usuario>(
            new CommandDefinition(sql, new { Login = login }, cancellationToken: cancellationToken)
        );
    }
}

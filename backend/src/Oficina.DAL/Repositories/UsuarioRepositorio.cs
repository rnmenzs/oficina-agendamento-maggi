using Dapper;
using Npgsql;
using Oficina.Domain.Entities;
using Oficina.Domain.Repositories;

namespace Oficina.DAL.Repositories;

public sealed class UsuarioRepositorio : IUsuarioRepositorio
{
    private readonly NpgsqlDataSource _fonteDeDados;

    public UsuarioRepositorio(NpgsqlDataSource fonteDeDados)
    {
        _fonteDeDados = fonteDeDados;
    }

    public async Task<Usuario?> ObterPorLoginAsync(string login, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT id, login, senha_hash AS SenhaHash, nome
            FROM usuarios
            WHERE login = @Login
            """;

        await using var conexao = await _fonteDeDados.OpenConnectionAsync(cancellationToken);

        var linha = await conexao.QuerySingleOrDefaultAsync<UsuarioLinha>(new CommandDefinition(
            sql,
            new { Login = login },
            cancellationToken: cancellationToken
        ));

        return linha is null ? null : Usuario.Reconstituir(linha.Id, linha.Login, linha.SenhaHash, linha.Nome);
    }

    private sealed record UsuarioLinha(Guid Id, string Login, string SenhaHash, string Nome);
}

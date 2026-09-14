using Dapper;
using Npgsql;
using Oficina.Domain.Entities;
using Oficina.Domain.Exceptions;
using Oficina.Domain.Repositories;

namespace Oficina.DAL.Repositories;

public sealed class ClienteRepositorio : IClienteRepositorio
{
    // Código do Postgres para violação de restrição de unicidade.
    private const string ViolacaoDeUnicidade = "23505";

    // Apelidos no próprio SQL em vez de ligar o casamento por sublinhado do Dapper,
    // que é estado global e afetaria todas as consultas do processo.
    private const string Colunas = """
        id            AS Id,
        nome          AS Nome,
        telefone      AS Telefone,
        email         AS Email,
        criado_em     AS CriadoEm,
        atualizado_em AS AtualizadoEm
        """;

    private readonly NpgsqlDataSource _fonteDeDados;

    public ClienteRepositorio(NpgsqlDataSource fonteDeDados)
    {
        _fonteDeDados = fonteDeDados;
    }

    public async Task<Cliente> AdicionarAsync(Cliente cliente, CancellationToken cancellationToken)
    {
        // O id vem do domínio; os carimbos vêm do banco e voltam pelo RETURNING.
        const string sql = """
            INSERT INTO clientes (id, nome, telefone, email)
            VALUES (@Id, @Nome, @Telefone, @Email)
            RETURNING criado_em AS CriadoEm, atualizado_em AS AtualizadoEm
            """;

        await using var conexao = await _fonteDeDados.OpenConnectionAsync(cancellationToken);

        try
        {
            var carimbos = await conexao.QuerySingleAsync<CarimbosLinha>(new CommandDefinition(
                sql,
                new
                {
                    cliente.Id,
                    cliente.Nome,
                    Telefone = cliente.Telefone.Valor,
                    Email = cliente.Email.Valor
                },
                cancellationToken: cancellationToken
            ));

            return Cliente.Reconstituir(
                cliente.Id,
                cliente.Nome,
                cliente.Telefone.Valor,
                cliente.Email.Valor,
                EmUtc(carimbos.CriadoEm),
                EmUtc(carimbos.AtualizadoEm)
            );
        }
        // Traduz aqui porque a BLL não pode depender do Npgsql para reconhecer o erro.
        catch (PostgresException excecao) when (excecao.SqlState == ViolacaoDeUnicidade)
        {
            throw new ConflitoException("Já existe um cliente com este e-mail.");
        }
    }

    public async Task<Cliente?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken)
    {
        const string sql = $"""
            SELECT
            {Colunas}
            FROM clientes
            WHERE id = @Id
            """;

        await using var conexao = await _fonteDeDados.OpenConnectionAsync(cancellationToken);

        var linha = await conexao.QuerySingleOrDefaultAsync<ClienteLinha>(new CommandDefinition(
            sql,
            new { Id = id },
            cancellationToken: cancellationToken
        ));

        return linha is null ? null : Montar(linha);
    }

    public async Task<IReadOnlyList<Cliente>> ListarAsync(CancellationToken cancellationToken)
    {
        const string sql = $"""
            SELECT
            {Colunas}
            FROM clientes
            ORDER BY nome
            """;

        await using var conexao = await _fonteDeDados.OpenConnectionAsync(cancellationToken);

        var linhas = await conexao.QueryAsync<ClienteLinha>(new CommandDefinition(
            sql,
            cancellationToken: cancellationToken
        ));

        return linhas.Select(Montar).ToList();
    }

    private static Cliente Montar(ClienteLinha linha)
    {
        return Cliente.Reconstituir(
            linha.Id,
            linha.Nome,
            linha.Telefone,
            linha.Email,
            EmUtc(linha.CriadoEm),
            EmUtc(linha.AtualizadoEm)
        );
    }

    // O Npgsql devolve timestamptz como DateTime em UTC, não como DateTimeOffset.
    // A conversão fica aqui, na fronteira com o banco, e o domínio só vê DateTimeOffset.
    private static DateTimeOffset EmUtc(DateTime instante)
    {
        return new DateTimeOffset(DateTime.SpecifyKind(instante, DateTimeKind.Utc), TimeSpan.Zero);
    }

    private sealed record ClienteLinha(
        Guid Id,
        string Nome,
        string Telefone,
        string Email,
        DateTime CriadoEm,
        DateTime AtualizadoEm
    );

    private sealed record CarimbosLinha(
        DateTime CriadoEm,
        DateTime AtualizadoEm
    );
}

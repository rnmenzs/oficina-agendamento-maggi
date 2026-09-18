using Oficina.Domain.Entities;
using Oficina.Domain.Repositories;

namespace Oficina.BLL.Autenticacao;

public sealed class AutenticacaoServico
{
    // Hash de uma senha qualquer, só para o BCrypt rodar quando o login não existe: sem isso a
    // resposta para usuário inexistente sai em milissegundos e a de senha errada em centenas —
    // e a diferença entrega quais logins existem.
    private const string HashDeComparacao = "$2a$11$ETqhc.3oNTMMzoq5aOd5iuRzCHEpGtlXapa1QRHPnZs7TbRo7lTU6";

    private readonly IUsuarioRepositorio _repositorio;

    public AutenticacaoServico(IUsuarioRepositorio repositorio)
    {
        _repositorio = repositorio;
    }

    /// <summary>O usuário, se login e senha conferem; nada em caso contrário — quem diz "não" é a API.</summary>
    public async Task<Usuario?> AutenticarAsync(string login, string senha, CancellationToken cancellationToken)
    {
        var usuario = await _repositorio.ObterPorLoginAsync(login, cancellationToken);

        var confere = BCrypt.Net.BCrypt.Verify(senha, usuario?.SenhaHash ?? HashDeComparacao);

        return usuario is not null && confere ? usuario : null;
    }
}

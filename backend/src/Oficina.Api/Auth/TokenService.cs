using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Oficina.Api.Auth;

/// <summary>
/// Gera tokens JWT assinados com HS256. A chave vem de <c>JWT_SECRET</c> no ambiente, o usuário
/// e senha válidos de <c>AUTH_USER</c> e <c>AUTH_PASSWORD</c>. Sem banco, sem hash — é a autenticação
/// "simples" que o enunciado pede como diferencial.
/// </summary>
public sealed class TokenService
{
    private const string Issuer = "oficina-api";
    private const string Audience = "oficina-api";
    private const int DefaultExpirationMinutes = 60;

    private readonly SigningCredentials _credentials;
    private readonly int _expirationMinutes;

    public TokenService()
    {
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? throw new InvalidOperationException(
                "A variável de ambiente JWT_SECRET não está definida. "
                + "Ela precisa ter pelo menos 32 caracteres.");

        if (secret.Length < 32)
            throw new InvalidOperationException(
                "JWT_SECRET precisa ter pelo menos 32 caracteres para HS256.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        _credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        _ = int.TryParse(
            Environment.GetEnvironmentVariable("JWT_EXPIRES_IN_MINUTES"),
            out var minutes
        );
        _expirationMinutes = minutes > 0 ? minutes : DefaultExpirationMinutes;
    }

    /// <summary>Gera um JWT assinado para o usuário informado.</summary>
    public string GerarToken(string usuario)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_expirationMinutes),
            signingCredentials: _credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>Parâmetros de validação para o middleware de autenticação.</summary>
    public static TokenValidationParameters ParametrosDeValidacao(string secret) => new()
    {
        ValidateIssuer = true,
        ValidIssuer = Issuer,
        ValidateAudience = true,
        ValidAudience = Audience,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
        ClockSkew = TimeSpan.FromSeconds(30)
    };
}

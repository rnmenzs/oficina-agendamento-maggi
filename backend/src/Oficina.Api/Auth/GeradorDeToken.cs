using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Oficina.Api.Auth;

/// <summary>
/// Emite e descreve como validar o JWT da API: HS256 com o segredo de <c>JWT_SECRET</c>, uma hora
/// de vida. É a parte de transporte da autenticação; quem confere login e senha é a BLL.
/// </summary>
public sealed class GeradorDeToken
{
    // Emissor e público são a própria API: não há outro sistema consumindo o token.
    private const string Emissor = "oficina-api";
    private static readonly TimeSpan Validade = TimeSpan.FromHours(1);

    private readonly SigningCredentials _credenciais;

    public GeradorDeToken(string segredo)
    {
        _credenciais = new SigningCredentials(Chave(segredo), SecurityAlgorithms.HmacSha256);
    }

    public string Gerar(string login)
    {
        var token = new JwtSecurityToken(
            issuer: Emissor,
            audience: Emissor,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, login),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            ],
            expires: DateTime.UtcNow.Add(Validade),
            signingCredentials: _credenciais
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static TokenValidationParameters ParametrosDeValidacao(string segredo) => new()
    {
        ValidateIssuer = true,
        ValidIssuer = Emissor,
        ValidateAudience = true,
        ValidAudience = Emissor,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = Chave(segredo),
        ClockSkew = TimeSpan.FromSeconds(30)
    };

    private static SymmetricSecurityKey Chave(string segredo) => new(Encoding.UTF8.GetBytes(segredo));
}

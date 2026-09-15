namespace Oficina.Domain.Exceptions;

// Separado de DomainException para a API responder 409 em vez de 400.
public sealed class ConflitoException : DomainException
{
    public ConflitoException(string message) : base(message)
    {
    }
}

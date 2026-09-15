namespace Oficina.Domain.Exceptions;

// Separado de DomainException para a API responder 404 em vez de 400.
public sealed class NaoEncontradoException : DomainException
{
    public NaoEncontradoException(string message) : base(message)
    {
    }
}

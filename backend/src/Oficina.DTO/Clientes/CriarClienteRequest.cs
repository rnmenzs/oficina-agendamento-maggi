namespace Oficina.DTO.Clientes;

// Anuláveis porque a marcação de nulidade do C# não vale em tempo de execução: um JSON incompleto
// chega com nulo de qualquer forma, e quem recusa com mensagem clara é a validação do domínio.
public sealed record CriarClienteRequest(
    string? Nome,
    string? Telefone,
    string? Email
);

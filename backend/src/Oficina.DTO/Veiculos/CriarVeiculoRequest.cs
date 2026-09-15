namespace Oficina.DTO.Veiculos;

// Sem o id do cliente: ele vem da rota. Tê-lo também no corpo permitiria os dois discordarem.
// Placa e modelo anuláveis porque a marcação de nulidade do C# não vale em tempo de execução;
// quem recusa com mensagem clara é a validação do domínio.
public sealed record CriarVeiculoRequest(
    string? Placa,
    string? Modelo,
    int Ano
);

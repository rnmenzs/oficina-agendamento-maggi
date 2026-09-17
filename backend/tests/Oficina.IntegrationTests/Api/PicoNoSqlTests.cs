using System.Net;
using System.Net.Http.Json;
using Oficina.IntegrationTests.Infra;

namespace Oficina.IntegrationTests.Api;

// A regra "no máximo três ao mesmo tempo" é medida por uma consulta SQL de pico — e é essa
// consulta, e não a cópia dela no falso, que estes testes batem. São os cenários conferidos à mão
// em 16/09, quando a versão anterior (que contava quem cruzava a janela) recusava horário que cabia.
[Collection("api")]
public sealed class PicoNoSqlTests(ApiDeTeste api)
{
    [Fact]
    public async Task Servico_longo_sobre_tres_curtos_em_sequencia_cabe()
    {
        var veiculos = await api.CriarVeiculosAsync(4);

        // 09:00–09:30, 09:30–10:00, 10:00–10:30: os três cruzam a janela de um diagnóstico das
        // 09:00 às 10:30, mas em nenhum instante há mais de um deles.
        foreach (var (veiculo, minutos) in veiculos.Take(3).Zip([0, 30, 60]))
        {
            Assert.Equal(HttpStatusCode.Created, (await api.AgendarAsync(veiculo.Id, Dia.UtilAs(3, 9).AddMinutes(minutos))).StatusCode);
        }

        var longo = await api.AgendarAsync(veiculos[3].Id, Dia.UtilAs(3, 9), "Diagnostico");

        Assert.Equal(HttpStatusCode.Created, longo.StatusCode);
    }

    [Fact]
    public async Task Quarto_servico_no_mesmo_horario_e_recusado()
    {
        var veiculos = await api.CriarVeiculosAsync(4);

        foreach (var veiculo in veiculos.Take(3))
        {
            Assert.Equal(HttpStatusCode.Created, (await api.AgendarAsync(veiculo.Id, Dia.UtilAs(4, 9))).StatusCode);
        }

        Assert.Equal(HttpStatusCode.Conflict, (await api.AgendarAsync(veiculos[3].Id, Dia.UtilAs(4, 9))).StatusCode);
    }

    [Fact]
    public async Task Servico_que_comeca_quando_os_tres_terminam_cabe()
    {
        var veiculos = await api.CriarVeiculosAsync(4);

        // Três trocas de óleo das 09:00 às 09:30. Às 09:30 elas já acabaram: borda não conta.
        foreach (var veiculo in veiculos.Take(3))
        {
            Assert.Equal(HttpStatusCode.Created, (await api.AgendarAsync(veiculo.Id, Dia.UtilAs(5, 9))).StatusCode);
        }

        Assert.Equal(HttpStatusCode.Created, (await api.AgendarAsync(veiculos[3].Id, Dia.UtilAs(5, 9, 30))).StatusCode);
    }

    [Fact]
    public async Task Cancelado_libera_a_vaga()
    {
        var veiculos = await api.CriarVeiculosAsync(4);
        var inicio = Dia.UtilAs(6, 9);
        var criados = new List<AgendamentoIdentificado>();

        foreach (var veiculo in veiculos.Take(3))
        {
            var resposta = await api.AgendarAsync(veiculo.Id, inicio);
            criados.Add((await resposta.Content.ReadFromJsonAsync<AgendamentoIdentificado>())!);
        }

        Assert.Equal(HttpStatusCode.OK, (await api.MudarStatusAsync(criados[0].Id, "Cancelado")).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await api.AgendarAsync(veiculos[3].Id, inicio)).StatusCode);
    }

    private sealed record AgendamentoIdentificado(Guid Id);
}

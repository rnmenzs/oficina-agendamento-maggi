using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Oficina.DTO.Agendamentos;
using Oficina.IntegrationTests.Infra;

namespace Oficina.IntegrationTests.Api;

// O que a suíte unitária não prova: ali o repositório é um falso que reimplementa o SQL. Aqui as
// requisições chegam juntas de verdade, e quem segura é o banco — a constraint de exclusão, o
// advisory lock da capacidade e a gravação condicional do status.
[Collection("api")]
public sealed class ConcorrenciaTests(ApiDeTeste api)
{
    [Fact]
    public async Task Dois_pedidos_simultaneos_do_mesmo_veiculo_no_mesmo_horario_gravam_um_so()
    {
        var veiculo = (await api.CriarVeiculosAsync(1))[0];
        var inicio = Dia.UtilAs(0, 9);

        var respostas = await Task.WhenAll(
            api.AgendarAsync(veiculo.Id, inicio),
            api.AgendarAsync(veiculo.Id, inicio)
        );

        Assert.Equal(
            [HttpStatusCode.Created, HttpStatusCode.Conflict],
            respostas.Select(r => r.StatusCode).OrderBy(s => s)
        );
    }

    [Fact]
    public async Task Seis_pedidos_simultaneos_no_mesmo_horario_gravam_tres()
    {
        var veiculos = await api.CriarVeiculosAsync(6);
        var inicio = Dia.UtilAs(1, 9);

        var respostas = await Task.WhenAll(veiculos.Select(v => api.AgendarAsync(v.Id, inicio)));

        Assert.Equal(3, respostas.Count(r => r.StatusCode == HttpStatusCode.Created));
        Assert.Equal(3, respostas.Count(r => r.StatusCode == HttpStatusCode.Conflict));

        var recusa = await respostas.First(r => r.StatusCode == HttpStatusCode.Conflict)
            .Content.ReadFromJsonAsync<ProblemDetails>();

        Assert.Equal("A oficina já tem 3 serviços nesse horário.", recusa!.Detail);
    }

    [Fact]
    public async Task Duas_trocas_de_status_simultaneas_no_mesmo_agendamento_aplicam_uma_so()
    {
        var veiculo = (await api.CriarVeiculosAsync(1))[0];
        var criado = await (await api.AgendarAsync(veiculo.Id, Dia.UtilAs(2, 9)))
            .Content.ReadFromJsonAsync<AgendamentoResponse>();

        var respostas = await Task.WhenAll(
            api.MudarStatusAsync(criado!.Id, "EmAndamento"),
            api.MudarStatusAsync(criado.Id, "EmAndamento")
        );

        // Uma passa. A outra é recusada de um dos dois jeitos, conforme a ordem em que chegaram ao
        // banco: pela gravação condicional (409, "mudou enquanto") ou, se leu depois da primeira
        // gravar, pela regra de transição (400, "não é possível mudar de Em andamento para…").
        Assert.Equal(1, respostas.Count(r => r.StatusCode == HttpStatusCode.OK));
        Assert.Contains(
            respostas.Single(r => r.StatusCode != HttpStatusCode.OK).StatusCode,
            new[] { HttpStatusCode.Conflict, HttpStatusCode.BadRequest }
        );

        var final = await api.Cliente.GetFromJsonAsync<AgendamentoDetalheResponse>($"/api/agendamentos/{criado.Id}");
        Assert.Equal("EmAndamento", final!.Status);
    }
}

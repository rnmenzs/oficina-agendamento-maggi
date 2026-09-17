# Oficina · Agendamento de serviços

Sistema para uma oficina mecânica agendar serviços (troca de óleo, revisão e diagnóstico) nos veículos dos seus clientes.

- **Backend:** ASP.NET Core Web API (.NET 10), DDD em camadas (Domain, BLL, DAL, DTO, Api), SQL escrito à mão com Dapper sobre PostgreSQL, Swagger, testes em xUnit.
- **Frontend:** React + TypeScript + React Router v7 em modo framework, SPA (`ssr: false`), rotas por pasta com `flatRoutes()`.

## Estrutura do repositório

```
backend/                  solução .NET (Oficina.slnx)
  src/Oficina.Domain      entidades com comportamento, value objects, regras puras, interfaces de repositório
  src/Oficina.BLL         casos de uso: orquestram domínio e repositórios
  src/Oficina.DAL         repositórios com SQL parametrizado (Dapper + Npgsql)
  src/Oficina.DTO         requests e responses da API
  src/Oficina.Api         controllers, injeção de dependência, middleware de erros, Swagger, CORS
  tests/Oficina.Tests     testes unitários das regras de negócio (xUnit)
frontend/                 aplicação React Router v7 (SPA)
scripts/                  scripts SQL numerados: tabelas, restrições e índices, seed e migrations
docker-compose.yml        PostgreSQL já com os scripts executados
run.sh                    sobe banco, API e frontend com um comando
.env.example              template de variáveis de ambiente (copiar para .env)
```

Dependências entre as camadas: `Api → BLL, DTO, DAL` · `BLL → Domain, DTO` · `DAL → Domain` · `Domain` e `DTO` não dependem de nada.

## Como rodar

### Pré-requisitos

- .NET SDK 10
- Node.js 22 ou superior
- Docker com Compose (para o banco), ou um PostgreSQL 16 ou superior instalado

### 0. Variáveis de ambiente

Copie o arquivo de exemplo e preencha as credenciais do banco:

```bash
cp .env.example .env
```

O `.env` é lido tanto pelo Docker Compose (credenciais do banco) quanto pelo backend .NET (connection string e CORS). Os valores `YOUR_*` precisam ser substituídos; `DB_PORT` e `CORS_ORIGINS` já vêm prontos para uso local.

| Variável | Exemplo | Descrição |
|---|---|---|
| `POSTGRES_USER` | `YOUR_USERNAME` | Usuário do PostgreSQL |
| `POSTGRES_PASSWORD` | `YOUR_PASSWORD` | Senha do PostgreSQL |
| `POSTGRES_DB` | `YOUR_DATABASE` | Nome do banco |
| `DB_PORT` | `5432` | Porta exposta no host |
| `CONNECTION_STRING` | `Host=localhost;Port=5432;...` | Connection string do backend, montada com os mesmos usuário, senha, banco e porta |
| `CORS_ORIGINS` | `http://localhost:5173` | Origens permitidas no CORS (separadas por vírgula) |

> **Nota:** O `.env` está no `.gitignore`. Apenas o `.env.example` é versionado.

### Tudo de uma vez

Com o `.env` preenchido, um comando sobe banco, API e frontend:

```bash
./run.sh
```

Ele espera cada peça responder antes de seguir para a próxima, aplica as migrations pendentes e, no fim, imprime os endereços. Com tudo no ar, o terminal escuta teclas:

| Tecla | Faz |
|---|---|
| `r` | reinicia a API e o frontend |
| `z` | zera o banco: apaga o volume, recria com os scripts e sobe a API de novo |
| `q` ou `Ctrl+C` | derruba tudo, banco incluído — o volume fica, os dados voltam na próxima subida |

Para já começar com o banco vazio, `./run.sh --reset`.

A saída de cada processo vai para `.run/api.log` e `.run/web.log`, apagados a cada execução. Se uma porta já estiver ocupada, o script recusa em vez de subir pela metade.

As seções abaixo são o passo a passo equivalente, para rodar cada parte separadamente ou sem Docker.

### 1. Banco de dados

**Com Docker (recomendado).** Sobe o PostgreSQL 16 e executa os scripts da pasta `scripts/` em ordem na primeira inicialização:

```bash
docker compose up -d db
```

As credenciais vêm do `.env`. Se a porta já estiver em uso por outro PostgreSQL, altere `DB_PORT` no `.env` e ajuste `CONNECTION_STRING` com a mesma porta.

Os scripts só rodam quando o volume está vazio. Para recriar o banco do zero:

```bash
docker compose down -v && docker compose up -d db
```

**Sem Docker**, num PostgreSQL 16 ou superior já instalado. Crie o usuário e o banco como superusuário, no `psql` ou no cliente de sua preferência:

```sql
CREATE USER YOUR_USERNAME WITH PASSWORD 'YOUR_PASSWORD';
CREATE DATABASE YOUR_DATABASE OWNER YOUR_USERNAME;
```

Depois execute os scripts em ordem (substituindo as variáveis conforme seu `.env`):

```bash
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p ${DB_PORT:-5432} -U $POSTGRES_USER -d $POSTGRES_DB -f scripts/001_create_tables.sql
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p ${DB_PORT:-5432} -U $POSTGRES_USER -d $POSTGRES_DB -f scripts/002_constraints_and_indexes.sql
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p ${DB_PORT:-5432} -U $POSTGRES_USER -d $POSTGRES_DB -f scripts/003_seed.sql
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p ${DB_PORT:-5432} -U $POSTGRES_USER -d $POSTGRES_DB -f scripts/004_seed_volume.sql
```

Do `004` em diante são migrations: rodam também num banco que já existe, e cada uma é escrita para poder rodar de novo sem duplicar nada.

Mantenha `CONNECTION_STRING` no `.env` coerente com o usuário, a senha, o banco e a porta escolhidos.

### 2. Backend

```bash
cd backend
dotnet build
dotnet run --project src/Oficina.Api
```

API em `http://localhost:5062`. Documentação Swagger em `http://localhost:5062/swagger`.

O backend lê o `.env` da raiz do repositório automaticamente. Variáveis de ambiente do sistema têm prioridade sobre o arquivo.

Testes:

```bash
cd backend
dotnet test
```

### 3. Frontend

Precisa de Node 20 ou superior e do pnpm. Se não tiver o pnpm, `corepack enable` já o disponibiliza
nas versões recentes do Node.

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev
```

Aplicação em `http://localhost:5173`. **O backend precisa estar no ar**, porque as telas leem e
gravam pela API.

O endereço da API vem do `.env` do frontend, em `VITE_API_URL`, e o padrão aponta para
`http://localhost:5062/api`. Se você mudou a porta do backend, ajuste aqui também — e confira se a
origem do frontend está em `CORS_ORIGINS`, no `.env` da raiz, senão o navegador recusa as
requisições.

Conferir os tipos e gerar o pacote de produção:

```bash
pnpm typecheck
pnpm build
```

Há ainda a rota `/catalogo`, fora da navegação: ela mostra cada componente da interface em todos os
seus estados, inclusive os difíceis de alcançar numa tela real, como campo com erro ou falha de
carregamento. Serve para revisar a interface sem depender de dados.

## Decisões técnicas

**PostgreSQL.** Gratuito, sobe com um comando no Docker, e tem `tstzrange` com constraint de exclusão: o próprio banco garante que um veículo não tenha dois agendamentos sobrepostos, mesmo com requisições simultâneas.

**Dapper em vez de ADO.NET puro.** O SQL continua escrito à mão e parametrizado; o Dapper só tira o código repetitivo de ler o `DataReader` coluna por coluna. Não é ORM: não gera SQL nem rastreia entidades.

**Controllers em vez de Minimal APIs.** Deixam cada endpoint fino, com `[ProducesResponseType]` alimentando o Swagger e binding de DTO automático.

**xUnit.** É o framework dos templates oficiais do .NET. `[Theory]` com `[InlineData]` encaixa nas regras de negócio, que são tabelas de casos.

**Ids em UUID.** Decisão pensando num projeto real: inteiro autoincremento expõe o volume de registros, permite enumerar recursos pela URL e amarra a identidade ao banco. Com UUID a entidade nasce com id no domínio, via `Guid.CreateVersion7()`, ordenado por tempo e por isso amigável ao índice.

**Datas em `timestamptz`, respostas sempre em UTC.** A entrada aceita ISO 8601 com qualquer offset; a saída vem normalizada em UTC, e converter para exibição é trabalho do frontend. "Não agendar no passado" e "cancelar até 2 horas antes" comparam instantes, sem fuso. Já "das 08:00 às 18:00" é hora local: a regra converte para `America/Sao_Paulo` antes de olhar dia da semana e hora. O fuso fica na entidade, que também traduz um dia em faixa de instantes para a listagem — assim a string existe num lugar só. Sem essa tradução, um agendamento das 22:00 de sexta seria sábado em UTC e apareceria no dia errado.

**A listagem filtra por período, comparando a coluna direto.** O filtro recebe `dataInicio` e `dataFim`, e um dia só é pedir a mesma data nas duas pontas. O serviço pede a faixa meia-aberta de instantes ao domínio e o SQL compara `a.inicio >= @De AND a.inicio < @Ate`. A forma anterior, `(a.inicio AT TIME ZONE 'America/Sao_Paulo')::date = @Data`, dava o mesmo resultado mas envolvia a coluna numa função, o que impede o índice de `inicio`: medido com 200 mil linhas, 61 ms de varredura completa contra 0,3 ms usando o índice.

**O fim do serviço é inclusivo, e domingo é fechado.** Uma troca de óleo às 11:30 de sábado termina exatamente às 12:00 e é aceita; recusar obrigaria a oficina a parar de agendar antes de fechar. O serviço inteiro também precisa caber no mesmo dia.

**Coluna `fim` gravada, e conferida pelo banco.** A duração vem do tipo de serviço no domínio, mas gravar o fim torna capacidade e sobreposição uma comparação de intervalos indexável. Uma `CHECK` recalcula `inicio + duração` e recusa linha inconsistente, então as consultas confiam na coluna.

**Carimbos de tempo mantidos pelo banco.** `criado_em` por `DEFAULT now()` e `atualizado_em` movido por gatilho a cada `UPDATE`. Fica no banco, e não repetido em cada comando, por dois motivos: vale também para escrita manual em SQL, e mantém todos os instantes sob o mesmo relógio. A função do gatilho não cita tabela, então as três a reaproveitam. O efeito colateral aceito é o carimbo avançar mesmo quando nenhum valor muda.

**Enums simples, gravados e trafegados como texto.** Três tipos de serviço com um único atributo, a duração, e quatro status sem atributo nenhum não justificam classe de enumeração; o `switch` sobre enum ainda faz o compilador avisar quando um valor novo fica sem duração. No banco são texto com `CHECK`, legíveis direto na tabela. Nos DTOs também são texto, porque o projeto DTO não referencia o domínio e espelhar os enums criaria uma terceira cópia dos nomes.

**Placa normalizada.** Aceita `ABC-1234` ou `ABC1D23` em qualquer caixa e grava em maiúsculas sem hífen, com `UNIQUE` e `CHECK` de formato. Formatar para exibição é trabalho do frontend.

**Só `Agendado` e `EmAndamento` ocupam vaga.** Cancelado e concluído não contam para capacidade nem para sobreposição. O mesmo critério está nos índices parciais, na constraint de exclusão e nas consultas.

**Capacidade é pico, não contagem de janela.** A regra fala em três serviços *ao mesmo tempo*, então a pergunta que o banco responde é "qual o maior número de serviços simultâneos dentro deste período?" — e não "quantos cruzam este período". A diferença aparece com três serviços de trinta minutos em sequência: eles cruzam a janela de um de noventa sem nunca estarem juntos, e contá-los recusaria um horário que cabe. A consulta mede a lotação no início da janela e no início de cada agendamento dentro dela, porque o pico só muda quando alguém começa.

**Sobreposição por veículo garantida por constraint de exclusão.** Se duas requisições passarem pela validação ao mesmo tempo, o banco recusa a segunda — proteção contra concorrência sem código nenhum. A capacidade de três simultâneos não cabe numa constraint declarativa: é checada na BLL e garantida na gravação, que mede o pico de novo sob um advisory lock, na mesma transação do `INSERT`.

**As duas regras que consultam dados são checadas na BLL e garantidas na gravação.** A checagem na camada de regras mantém a regra junto das outras e recusa antes de tentar gravar. Sozinha ela tem brecha: entre consultar e gravar cabe outra requisição, e as duas passariam pela consulta. Para o veículo, a constraint de exclusão fecha essa janela. Para a capacidade, `pg_advisory_xact_lock` serializa quem grava agendamento: a gravação mede o pico dentro da transação, já enxergando o que a requisição anterior gravou, e recusa se não couber. Seis pedidos simultâneos para o mesmo horário entravam os seis antes disso; agora entram três.

**Alterar status é um endpoint só, e a gravação confere o status lido.** `PATCH /api/agendamentos/{id}/status` recebe o destino, em vez de três rotas por ação, porque a tela já precisa calcular quais transições valem para o status atual. A gravação leva o status anterior no `WHERE`: entre ler e gravar cabe outra requisição, e sem essa condição duas chamadas simultâneas validariam a transição sobre o mesmo status e a segunda apagaria a primeira, deixando um estado que nenhuma transição permite. Se nada for atualizado, a resposta é conflito.

**As consultas de agendamento trazem veículo e cliente.** Uma agenda que mostra só identificadores é inútil na tela, e buscar esses dados por linha custaria uma chamada por agendamento. A entidade continua referenciando o veículo por id: quem carrega os dados de exibição é a projeção que a consulta devolve, ao lado da entidade.

**Paginação começa pelos agendamentos.** `LIMIT` e `OFFSET` no próprio SQL, porque é onde há volume e filtro combinado. Clientes e veículos ainda trazem todas as linhas; numa rede com dezenas de lojas isso passa a incomodar, e a intenção é reaproveitar a mesma paginação neles.

**Mudança de esquema entra como migration.** Os scripts `001` a `003` são a linha de base de um banco novo e não se editam mais: qualquer alteração vira script novo, `004` em diante, aditivo e em transação. Editar um script já aplicado não muda nenhum banco que já exista — a diferença só apareceria em erro de execução.

**Seed com datas relativas.** Calculadas a partir da próxima segunda-feira no momento da execução, então continuam válidas em qualquer data. A próxima segunda às 09:00 já nasce com três serviços simultâneos, para a regra de capacidade poder ser testada na hora.

**Swagger sempre habilitado, redirecionamento HTTPS só fora de desenvolvimento.** Local a API roda em HTTP na 5062, sem certificado de desenvolvimento e sem redirect, que quebraria o preflight de CORS. O perfil `https` continua disponível com `dotnet run --launch-profile https`.

**Configuração via `.env`.** Credenciais em variáveis de ambiente mesmo num projeto de teste público. O `.env.example` versionado documenta as variáveis; o `.env` real não é versionado.

## O que faria diferente com mais tempo

Seção preenchida ao final do desenvolvimento.

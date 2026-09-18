# Oficina · Agendamento de serviços

Sistema para uma oficina mecânica agendar serviços (troca de óleo, revisão e diagnóstico) nos veículos dos seus clientes.

- **Backend:** ASP.NET Core Web API (.NET 10), DDD em camadas (Domain, BLL, DAL, DTO, Api), SQL escrito à mão com Dapper sobre PostgreSQL, autenticação por JWT, Swagger, testes em xUnit.
- **Frontend:** React + TypeScript + React Router v7 em modo framework, SPA (`ssr: false`), rotas por pasta com `flatRoutes()`, testes em Vitest.

## Estrutura do repositório

```
backend/                  solução .NET (Oficina.slnx)
  src/Oficina.Domain      entidades com comportamento, value objects, regras puras, interfaces de repositório
  src/Oficina.BLL         casos de uso: orquestram domínio e repositórios
  src/Oficina.DAL         repositórios com SQL parametrizado (Dapper + Npgsql)
  src/Oficina.DTO         requests e responses da API
  src/Oficina.Api         controllers, injeção de dependência, middleware de erros, JWT, Swagger, CORS
  tests/Oficina.Tests     testes unitários das regras de negócio (xUnit)
  tests/Oficina.IntegrationTests  API em memória sobre um banco criado na hora (xUnit)
frontend/                 aplicação React Router v7 (SPA); testes unitários em app/utils (Vitest)
scripts/                  scripts SQL numerados: tabelas, restrições e índices, seed e migrations
docker-compose.yml        PostgreSQL já com os scripts executados, e a API
backend/Dockerfile        imagem da API, em dois estágios
run.sh                    sobe banco e API em containers e o frontend com um comando, e escuta teclas
.env.example              template de variáveis de ambiente (copiar para .env)
```

Dependências entre as camadas: `Api → BLL, DTO, DAL` · `BLL → Domain, DTO` · `DAL → Domain` · `Domain` e `DTO` não dependem de nada.

## Como rodar

### Pré-requisitos

- Docker com Compose — o `run.sh` e o `docker compose up` sobem banco e API em containers
- Node.js 22 ou superior — o frontend roda na máquina
- .NET SDK 10 — só para rodar os testes ou a API fora do container (passo 2)

Sem Docker, um PostgreSQL 16 ou superior instalado serve para o banco (passo 1), e a API sobe com o SDK (passo 2).

### 0. Variáveis de ambiente

Copie o arquivo de exemplo e preencha as credenciais do banco:

```bash
cp .env.example .env
```

O `.env` é lido tanto pelo Docker Compose (credenciais do banco) quanto pelo backend .NET (connection string, CORS e segredo do JWT). Os valores `YOUR_*` precisam ser substituídos; `DB_PORT`, `CORS_ORIGINS` e `JWT_SECRET` já vêm prontos para uso local. Se o seu `.env` é de antes da autenticação, acrescente `JWT_SECRET`: sem ela nem o Compose nem a API sobem — de propósito, para um segredo padrão nunca ir parar num ambiente de verdade.

| Variável | Exemplo | Descrição |
|---|---|---|
| `POSTGRES_USER` | `YOUR_USERNAME` | Usuário do PostgreSQL |
| `POSTGRES_PASSWORD` | `YOUR_PASSWORD` | Senha do PostgreSQL |
| `POSTGRES_DB` | `YOUR_DATABASE` | Nome do banco |
| `DB_PORT` | `5432` | Porta exposta no host |
| `CONNECTION_STRING` | `Host=localhost;Port=5432;...` | Connection string do backend, montada com os mesmos usuário, senha, banco e porta |
| `CORS_ORIGINS` | `http://localhost:5173` | Origens permitidas no CORS (separadas por vírgula) |
| `API_PORT` | `5062` | Porta da API no host, para o Compose, para o `run.sh` e para o frontend (que a recebe como `VITE_API_URL`) |
| `JWT_SECRET` | `oficina-maggi-jwt-secret-...` | Segredo que assina os tokens de login, com pelo menos 32 caracteres; troque fora do ambiente local |

> **Nota:** O `.env` está no `.gitignore`. Apenas o `.env.example` é versionado.

### Tudo de uma vez

Com o `.env` preenchido, um comando sobe banco e API em containers e o frontend nesta máquina:

```bash
./run.sh
```

Ele constrói a imagem da API (a primeira vez demora; as seguintes usam cache), espera cada peça responder antes de seguir para a próxima, aplica as migrations pendentes e, no fim, imprime os endereços e onde cada peça roda — banco e API nos containers, o frontend como processo da máquina, com o pid. Ao encerrar, diz o motivo (`q`, `Ctrl+C` ou um sinal vindo de fora). Com tudo no ar, o terminal escuta teclas:

| Tecla | Faz |
|---|---|
| `r` | reconstrói a imagem da API com o código atual e reinicia API e frontend |
| `z` | zera o banco: esvazia clientes, veículos e agendamentos, sem seed; o esquema, o usuário de login, a API e o frontend ficam |
| `q` ou `Ctrl+C` | derruba tudo, banco incluído — o volume fica, os dados voltam na próxima subida |

Para recriar o banco do zero com o seed, `./run.sh --reset`.

A saída de cada processo vai para `.run/api.log` e `.run/web.log`, apagados a cada execução. Se uma porta já estiver ocupada, o script recusa em vez de subir pela metade.

### Só o Compose, sem o script

É o que o `run.sh` faz por baixo, sem as teclas e sem o frontend: o Compose sobe o banco com os scripts executados e a API compilada dentro do container.

```bash
docker compose up -d
```

A API fica em `http://localhost:5062` (Swagger em `/swagger`), a mesma porta do `dotnet run`, então o frontend não precisa saber de onde ela vem. Dentro da rede do Compose a API fala com o banco pelo nome do serviço, `db`, na porta interna — a `CONNECTION_STRING` do `.env` aponta para `localhost` e serve para a API rodando fora. O frontend sobe pelo passo 3.

A imagem é Debian, não Alpine, de propósito: as regras de horário leem o banco de fusos do sistema (`tzdata`), que a Alpine não traz.

Para saber de onde a API está respondendo, a primeira linha do log dela diz: `docker compose logs api` mostra *"Oficina API rodando dentro de um container Docker, banco em db"*; pelo `dotnet run`, *"nesta máquina (fora de container), banco em localhost"*.

Para rodar a API fora do container (passo 2, com o SDK), derrube só a do Compose antes: `docker compose stop api`. As duas usam a porta 5062.

As seções abaixo são o passo a passo equivalente, para rodar cada parte separadamente ou sem Docker.

### 1. Banco de dados

**Com Docker (recomendado).** Sobe o PostgreSQL 16 e executa os scripts da pasta `scripts/` em ordem na primeira inicialização:

```bash
docker compose up -d db
```

Só o banco, para quem vai subir a API com o SDK (passo 2). As credenciais vêm do `.env`. Se a porta já estiver em uso por outro PostgreSQL, altere `DB_PORT` no `.env` e ajuste `CONNECTION_STRING` com a mesma porta.

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
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p ${DB_PORT:-5432} -U $POSTGRES_USER -d $POSTGRES_DB -f scripts/004_usuarios.sql
```

Do `004` em diante são migrations: rodam também num banco que já existe, e cada uma é escrita para poder rodar de novo sem duplicar nada. Num volume do Compose criado antes de uma migration, quem a aplica é o `./run.sh`, a cada subida; sem o script, rode-a com o `psql` acima ou recrie o volume.

Mantenha `CONNECTION_STRING` no `.env` coerente com o usuário, a senha, o banco e a porta escolhidos.

### 2. Backend

```bash
cd backend
dotnet build
dotnet run --project src/Oficina.Api
```

API em `http://localhost:5062`. Documentação Swagger em `http://localhost:5062/swagger`.

O backend lê o `.env` da raiz do repositório automaticamente. Variáveis de ambiente do sistema têm prioridade sobre o arquivo.

Login:

Todos os endpoints de clientes, veículos e agendamentos exigem um token. Ele vem de `POST /api/auth/login` com o usuário que a migration `004` cria:

```json
{ "usuario": "admin", "senha": "admin" }
```

A resposta traz `{ "token": "..." }`, que vai no cabeçalho `Authorization: Bearer <token>` e vale por uma hora. No Swagger, o botão **Authorize** recebe o token e passa a mandá-lo em todas as chamadas. Login ou senha errados respondem `401` com a mesma frase para os dois casos; token ausente, inválido ou vencido responde `401` sem corpo.

Testes:

```bash
cd backend
dotnet test
```

São duas suítes. `Oficina.Tests` (unitária) prova as regras de negócio contra repositórios falsos e roda sem nada no ar. `Oficina.IntegrationTests` sobe a API em memória sobre um banco criado na hora no PostgreSQL do Compose — `oficina_teste_<id>`, com os scripts de estrutura (`001`, `002` e `004`), apagado no fim — e prova o que só o banco prova: a constraint de exclusão e o advisory lock sob pedidos simultâneos, a gravação condicional de status, a consulta de pico, o formato das recusas e a autenticação: o login com a senha da migration, e a recusa de quem chega sem token ou com um token que a API não assinou. Os outros testes fazem esse login uma vez e mandam o token em toda chamada, então o JWT é conferido de verdade em cada um. Precisa do banco no ar (`docker compose up -d db`); sem ele, falha dizendo isso. Para rodar só uma:

```bash
dotnet test tests/Oficina.Tests
dotnet test tests/Oficina.IntegrationTests
```

### 3. Frontend

Precisa de Node 22 ou superior e do pnpm. Se não tiver o pnpm, `corepack enable` já o disponibiliza
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

A primeira tela é a de login (`admin` / `admin`). O token fica no `localStorage` e vai em toda
chamada; quando ele vence, a próxima chamada recebe `401` e a aplicação volta para o login. O botão
de sair fica na barra, à direita.

Conferir os tipos e gerar o pacote de produção:

```bash
pnpm typecheck
pnpm build
```

Testes:

```bash
pnpm test
```

São testes unitários com o Vitest sobre `app/utils`, que é onde as regras do domínio aparecem do
lado de cá: a oferta de horários com as três vagas e o pico dentro da janela, o expediente de
sábado, as transições de status, as máscaras de placa e telefone e a leitura de dia e hora no fuso
da oficina. Não sobem navegador nem precisam do backend. O relógio entra por parâmetro em tudo que
depende dele, e a suíte passa igual em qualquer fuso da máquina.

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

**Mudança de esquema entra como migration.** Os scripts `001` e `002` são a linha de base de um banco novo e não se editam mais: qualquer alteração de esquema vira script novo, `004` em diante, aditivo e em transação. Editar um script já aplicado não muda nenhum banco que já exista — a diferença só apareceria em erro de execução. O `003` é só dado de teste, e por isso pode crescer: o volume de agendamentos que cerca o dia de hoje vive nele.

**Seed com datas relativas.** Calculadas a partir da próxima segunda-feira no momento da execução, então continuam válidas em qualquer data. A próxima segunda às 09:00 já nasce com três serviços simultâneos, para a regra de capacidade poder ser testada na hora.

**Swagger sempre habilitado, redirecionamento HTTPS só fora de desenvolvimento e só com porta HTTPS configurada.** Local a API roda em HTTP na 5062, sem certificado de desenvolvimento e sem redirect, que quebraria o preflight de CORS; no container ela também só escuta HTTP. O perfil `https` continua disponível com `dotnet run --launch-profile https`.

**Configuração via `.env`.** Credenciais em variáveis de ambiente mesmo num projeto de teste público. O `.env.example` versionado documenta as variáveis; o `.env` real não é versionado.

**Autenticação simples: um usuário na tabela, JWT sem refresh.** Simples aqui é o que a oficina tem: uma pessoa na recepção. A senha fica em BCrypt na tabela `usuarios` — não em variável de ambiente, para a troca de senha ser um `UPDATE` e não um deploy. Quem confere login e senha é a BLL; a API só emite o token, assinado com HS256 e válido por uma hora, sem refresh: vencido, a tela pede login de novo. Login e senha errados recebem a mesma frase, e a conferência roda mesmo quando o login não existe, para o tempo de resposta não contar quais existem. A guarda no frontend é conveniência (evita mostrar uma tela que a API recusaria); quem protege é a API. O `admin`/`admin` que a migration deixa é credencial de desenvolvimento: num ambiente real o primeiro usuário seria provisionado a partir do ambiente, como o `JWT_SECRET`, e o login teria limite de tentativas.

## O que faria diferente com mais tempo

Seção preenchida ao final do desenvolvimento.

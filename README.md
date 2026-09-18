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

**PostgreSQL com Dapper.** O PostgreSQL tem `tstzrange` com constraint de exclusão: é o próprio banco quem garante que um veículo não tenha dois agendamentos sobrepostos, mesmo sob requisições simultâneas. O Dapper só poupa a leitura do `DataReader` coluna a coluna — não gera SQL nem rastreia entidades.

**Ids em UUID, gerados no domínio.** Inteiro sequencial expõe volume, permite enumerar recursos pela URL e amarra a identidade ao banco. `Guid.CreateVersion7()` é ordenado por tempo, então não fragmenta o índice.

**Instantes em `timestamptz`, respostas em UTC, expediente no fuso da oficina.** A entrada aceita ISO 8601 com qualquer offset e a saída sai em UTC; exibir é trabalho do frontend. "Não agendar no passado" e "cancelar até 2 horas antes" comparam instantes. "Das 08:00 às 18:00" é hora local: a regra converte para `America/Sao_Paulo` antes de olhar dia e hora, e o mesmo fuso traduz um dia em faixa de instantes para a listagem — sem isso, um agendamento das 22:00 de sexta cairia no sábado em UTC. A listagem compara a coluna direto (`inicio >= @De AND inicio < @Ate`) em vez de envolvê-la em `AT TIME ZONE`, que impede o índice: com 200 mil linhas, 0,3 ms contra 61 ms.

**Coluna `fim` gravada e conferida pelo banco.** A duração vem do tipo de serviço, mas gravar o fim torna capacidade e sobreposição comparações de intervalo indexáveis; uma `CHECK` recalcula `inicio + duração` e recusa linha inconsistente. "Terminar dentro do horário" é lido com o fim inclusivo: uma troca de óleo às 11:30 de sábado termina às 12:00 e é aceita.

**Enums e placa como texto no banco.** Tipos de serviço e status são enum no código e texto com `CHECK` no banco, legíveis direto na tabela; nos DTOs também são texto, porque o projeto DTO não referencia o domínio. A placa é aceita com ou sem hífen, em qualquer caixa, e gravada em maiúsculas sem hífen.

**Capacidade é pico, não contagem de janela.** "Três serviços ao mesmo tempo" é lido como "qual o maior número de simultâneos dentro deste período?", e não "quantos o cruzam". Três serviços de trinta minutos em sequência cruzam a janela de um de noventa sem nunca estarem juntos; contá-los recusaria um horário que cabe. A consulta mede a lotação no início da janela e no início de cada agendamento dentro dela, porque o pico só muda quando alguém começa. Só `Agendado` e `EmAndamento` contam — o mesmo critério dos índices parciais e da constraint de exclusão.

**Concorrência fechada na gravação.** A checagem na BLL recusa antes de tentar gravar, mas entre consultar e gravar cabe outra requisição. Para o veículo, a constraint de exclusão fecha a janela. Para a capacidade, que não cabe numa constraint declarativa, `pg_advisory_xact_lock` serializa quem grava agendamento: a gravação mede o pico de novo dentro da transação do `INSERT` e recusa se não couber. Seis pedidos simultâneos para o mesmo horário entravam os seis; agora entram três.

**Mudar status é um endpoint, e a gravação confere o status lido.** `PATCH /api/agendamentos/{id}/status` recebe o destino, porque a tela já calcula quais transições valem. O `UPDATE` leva o status anterior no `WHERE`: sem isso, duas chamadas simultâneas validariam a transição sobre o mesmo status e a segunda apagaria a primeira. Se nada for atualizado, a resposta é conflito.

**As consultas de agendamento trazem veículo e cliente.** Agenda que mostra só identificadores é inútil na tela, e buscar por linha custaria uma chamada por agendamento. A entidade continua referenciando o veículo por id; os dados de exibição vêm numa projeção ao lado dela.

**Mudança de esquema entra como migration.** `001` e `002` são a linha de base de um banco novo e não se editam mais; alteração de esquema vira script novo, `004` em diante, aditivo, em transação e reexecutável. O `003` é só dado de teste, com datas relativas à próxima segunda-feira, e por isso pode crescer — a próxima segunda às 09:00 já nasce com três serviços simultâneos, para a regra de capacidade poder ser testada na hora.

**Autenticação simples: um usuário na tabela, JWT sem refresh.** Simples aqui é o que a oficina tem: uma pessoa na recepção. A senha fica em BCrypt na tabela `usuarios`, para a troca ser um `UPDATE` e não um deploy. A BLL confere login e senha; a API só emite o token, HS256, uma hora de vida. Login e senha errados recebem a mesma frase, e a conferência roda mesmo quando o login não existe, para o tempo de resposta não contar quais existem. O segredo vem do ambiente sem valor padrão: faltando, nem o Compose nem a API sobem. A guarda no frontend é conveniência; quem protege é a API. O `admin`/`admin` da migration é credencial de desenvolvimento.

## O que faria diferente com mais tempo

- **Uma entidade de oficina.** Fuso, horário de funcionamento e dias de atendimento são constantes do domínio. Com a oficina como entidade, o expediente seria configurável, um feriado ou um dia fechado seria um registro em vez de um deploy, e uma rede com lojas em fusos diferentes teria cada unidade com o seu.
- **Catálogo de serviços em tabela.** Tipo e duração são enum no código e `CHECK` no banco — garantia forte, mas serviço novo exige migration e deploy. Para um catálogo que muda, a duração viria do banco.
- **Paginação em clientes e veículos.** Só a agenda pagina; as outras listagens trazem tudo, e a busca de clientes filtra em memória. A paginação já existe e é questão de reaproveitá-la.
- **Validação devolvendo todos os erros de uma vez.** Hoje a entidade recusa no primeiro campo inválido; um formulário com três campos errados precisa de três envios.
- **`ano` e `ano_modelo` no veículo.** O documento brasileiro traz os dois, com tetos diferentes. É um campo a mais atravessando esquema, domínio, DTO e formulário.
- **Histórico de status em tabela própria.** O agendamento guarda só o status atual e a data da última mudança; quem mudou, quando e de onde é o que uma oficina pergunta quando algo dá errado.
- **Autenticação de verdade.** Provisionar o primeiro usuário a partir do ambiente em vez da migration, limitar tentativas no login, mover a sessão para cookie `HttpOnly` em vez do `localStorage`, devolver o `401` do middleware no mesmo formato `problem+json` das outras recusas e voltar para a tela pedida depois do login.

- **Frontend no Compose e um pipeline de CI.** O `docker compose up` sobe banco e API; o frontend ainda roda na máquina, e as três suítes de teste rodam à mão. Uma imagem com o build servido por nginx e um workflow que rode `dotnet test` e `pnpm test` a cada PR fechariam a entrega.


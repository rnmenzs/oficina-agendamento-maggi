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
scripts/                  scripts SQL numerados: tabelas, restrições e índices, dados iniciais
docker-compose.yml        PostgreSQL já com os scripts executados
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
```

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

Em construção.

## Decisões técnicas

**PostgreSQL.** Além de ser gratuito e simples de subir com Docker, tem `tstzrange` e constraints de exclusão, que garantem no próprio banco que um veículo não tenha dois agendamentos ativos sobrepostos, mesmo com requisições concorrentes.

**Dapper em vez de ADO.NET puro.** O SQL continua cem por cento escrito à mão e parametrizado. O Dapper só elimina o código repetitivo de abrir `DataReader` e ler coluna por coluna, o que reduz erros bobos de índice ou de tipo. Não é um ORM: não gera SQL nem rastreia entidades.

**xUnit.** É o framework usado pelos templates oficiais do .NET e pelo próprio ASP.NET Core. `[Theory]` com `[InlineData]` encaixa bem nas regras de negócio, que são tabelas de casos (horário de funcionamento, transições de status).

**Controllers em vez de Minimal APIs.** Com cinco recursos e validação de entrada, controllers mantêm cada endpoint fino e legível, com `[ProducesResponseType]` para o Swagger e binding de DTO automático.

**Ids em UUID.** Decisão pensando num projeto real, onde inteiro autoincremento não seria usado: expõe o volume de registros, permite enumerar recursos pela URL e amarra a identidade ao banco. Com UUID a entidade nasce com id no domínio, via `Guid.CreateVersion7()`, que é ordenado por tempo e por isso não fragmenta o índice como o UUID aleatório. O `DEFAULT gen_random_uuid()` nas tabelas é só fallback para o seed.

**Coluna `fim` gravada.** A duração é derivada do tipo de serviço no domínio, mas gravar o fim torna as consultas de capacidade e sobreposição uma comparação de intervalos simples e indexável (`inicio < :fim AND fim > :inicio`).

**Datas em `timestamptz` e fuso fixo da oficina.** A API recebe e devolve datas em ISO 8601 com offset. As regras "não agendar no passado" e "cancelar até 2 horas antes" comparam instantes, sem fuso. A regra de horário de funcionamento converte o instante para o fuso da oficina (`America/Sao_Paulo`) antes de olhar dia da semana e hora.

**Carimbos de tempo mantidos pelo banco.** As três tabelas têm `criado_em` e `atualizado_em`, ambos com `DEFAULT now()`. O padrão só vale no insert, então um gatilho move `atualizado_em` a cada `UPDATE`. A regra fica no banco em vez de repetida em cada comando da aplicação por dois motivos: vale também para escrita manual em SQL, e mantém todos os instantes sob o mesmo relógio, o do Postgres. A função do gatilho não cita tabela, então as três a reaproveitam e incluir uma nova custa uma linha. O efeito colateral aceito é que o carimbo avança em qualquer `UPDATE`, mesmo quando nenhum valor muda.

**Placa normalizada.** Aceita `ABC-1234` ou `ABC1D23` na entrada (qualquer caixa) e grava em maiúsculas sem hífen, com `UNIQUE` e `CHECK` de formato no banco. A formatação para exibição fica no frontend.

**Enum simples para tipo de serviço e status, sem classe de enumeração.** São três tipos com um único atributo, a duração, e quatro status sem atributo nenhum. O `switch` sobre enum faz o compilador avisar quando um valor novo fica sem duração, o DTO expõe o nome como texto e a DAL lê e grava pelo mesmo nome, que é o do `CHECK` no banco. Uma classe de enumeração só compensaria se o tipo ganhasse mais dados, como preço, ou viesse do banco.

**Status e tipo de serviço como texto com `CHECK`.** Legível direto no banco e espelha os enums do domínio, sem tabela de lookup para três valores.

**Só `Agendado` e `EmAndamento` ocupam vaga.** Para capacidade e sobreposição, agendamentos `Cancelado` e `Concluido` não contam. Esse critério está nos índices parciais e na constraint de exclusão, e as consultas da BLL usam o mesmo filtro.

**O banco confere que `fim` bate com a duração do tipo de serviço.** Uma `CHECK` recalcula `inicio + duração` e recusa qualquer linha inconsistente, então as consultas de capacidade podem confiar na coluna.

**Constraint de exclusão para sobreposição por veículo.** Protege a regra 4 contra concorrência sem nenhum código extra: se duas requisições passarem pela validação ao mesmo tempo, o banco recusa a segunda. A regra de capacidade (3 simultâneos) não cabe numa constraint declarativa e é tratada na camada BLL.

**Seed com datas relativas.** Os agendamentos iniciais são calculados a partir da próxima segunda-feira no momento da execução, então continuam válidos em qualquer data. A próxima segunda às 09:00 já tem três serviços simultâneos, o que permite testar a regra de capacidade na hora. Cada script roda numa transação: ou aplica tudo, ou nada.

**Listagem de clientes sem paginação.** Uma oficina tem dezenas de clientes, não milhares, e a tela de clientes é usada para busca pontual. Paginação fica onde há volume e filtro combinado, que é a listagem de agendamentos. Se o cadastro crescer, a mudança é local: um parâmetro de página no repositório e `LIMIT`/`OFFSET` na consulta.

**Swagger sempre habilitado e redirecionamento HTTPS só fora de desenvolvimento.** Local, a API roda em HTTP na porta 5062, sem certificado de desenvolvimento e sem redirect, que quebraria o preflight de CORS. O perfil `https` continua disponível com `dotnet run --launch-profile https`. Em produção, TLS normalmente termina num proxy reverso na frente da API.

**Configuração via `.env`.** Mesmo sendo um projeto de teste público, credenciais e configurações ficam em variáveis de ambiente para seguir boas práticas. O `.env.example` versionado documenta todas as variáveis necessárias; o `.env` real fica no `.gitignore`.

## O que faria diferente com mais tempo

Seção preenchida ao final do desenvolvimento.

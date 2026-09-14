-- 001: criação das tabelas, com chaves primárias e estrangeiras.
--
-- Os scripts desta pasta são executados em ordem numérica:
--   * automaticamente pelo container do Postgres na PRIMEIRA subida (docker-entrypoint-initdb.d), ou
--   * manualmente (usando as credenciais do seu .env):
--     export $(grep -v '^#' .env | xargs) && PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p ${DB_PORT:-5432} -U $POSTGRES_USER -d $POSTGRES_DB -v ON_ERROR_STOP=1 -f scripts/001_create_tables.sql
--
-- Cada script roda dentro de uma transação: ou aplica tudo, ou nada.

BEGIN;

-- Ids em UUID, decisão pensando num projeto real, onde inteiro autoincremento não seria usado:
-- expõe o volume de registros, permite enumerar recursos pela URL e amarra a identidade ao banco.
-- Com UUID a entidade nasce com id no domínio (Guid.CreateVersion7() na aplicação, ordenado por tempo,
-- amigável ao índice). O DEFAULT gen_random_uuid() é só fallback, usado pelo seed.

CREATE TABLE clientes (
    id         UUID          NOT NULL DEFAULT gen_random_uuid(),
    nome       VARCHAR(150)  NOT NULL,
    telefone   VARCHAR(20)   NOT NULL,
    email      VARCHAR(254)  NOT NULL,                     -- gravado em minúsculas pelo value object Email
    criado_em  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT pk_clientes PRIMARY KEY (id)
);

CREATE TABLE veiculos (
    id          UUID          NOT NULL DEFAULT gen_random_uuid(),
    cliente_id  UUID          NOT NULL,
    placa       VARCHAR(7)    NOT NULL,                    -- normalizada: maiúscula e sem hífen (ABC1234 ou ABC1D23)
    modelo      VARCHAR(100)  NOT NULL,
    ano         INTEGER       NOT NULL,
    criado_em   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT pk_veiculos PRIMARY KEY (id),
    CONSTRAINT fk_veiculos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id)
);

CREATE TABLE agendamentos (
    id             UUID          NOT NULL DEFAULT gen_random_uuid(),
    veiculo_id     UUID          NOT NULL,
    inicio         TIMESTAMPTZ   NOT NULL,
    fim            TIMESTAMPTZ   NOT NULL,                 -- inicio + duração do tipo de serviço, gravado para as consultas de capacidade e sobreposição
    tipo_servico   VARCHAR(20)   NOT NULL,                 -- TrocaOleo | Revisao | Diagnostico
    status         VARCHAR(20)   NOT NULL DEFAULT 'Agendado', -- Agendado | EmAndamento | Concluido | Cancelado
    criado_em      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    atualizado_em  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT pk_agendamentos PRIMARY KEY (id),
    CONSTRAINT fk_agendamentos_veiculo FOREIGN KEY (veiculo_id) REFERENCES veiculos (id)
);

COMMIT;

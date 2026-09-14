-- 002: restrições e índices.

BEGIN;

-- Unicidade de negócio: um e-mail por cliente, uma placa por veículo.
ALTER TABLE clientes ADD CONSTRAINT uq_clientes_email UNIQUE (email);
ALTER TABLE veiculos ADD CONSTRAINT uq_veiculos_placa UNIQUE (placa);

-- Domínio dos valores: espelham os value objects e enums do projeto Domain.
-- O backend valida antes; aqui é a última linha de defesa contra dados inválidos.
ALTER TABLE clientes ADD CONSTRAINT ck_clientes_email_minusculo
    CHECK (email = lower(email));
ALTER TABLE veiculos ADD CONSTRAINT ck_veiculos_placa_formato
    CHECK (placa ~ '^[A-Z]{3}[0-9]{4}$' OR placa ~ '^[A-Z]{3}[0-9][A-Z][0-9]{2}$');
ALTER TABLE veiculos ADD CONSTRAINT ck_veiculos_ano
    CHECK (ano BETWEEN 1900 AND 2100);
ALTER TABLE agendamentos ADD CONSTRAINT ck_agendamentos_tipo_servico
    CHECK (tipo_servico IN ('TrocaOleo', 'Revisao', 'Diagnostico'));
ALTER TABLE agendamentos ADD CONSTRAINT ck_agendamentos_status
    CHECK (status IN ('Agendado', 'EmAndamento', 'Concluido', 'Cancelado'));
-- fim deve ser exatamente inicio + duração do tipo de serviço.
-- Assim as consultas de capacidade e sobreposição podem confiar na coluna fim.
ALTER TABLE agendamentos ADD CONSTRAINT ck_agendamentos_fim_duracao
    CHECK (fim = inicio + CASE tipo_servico
                              WHEN 'TrocaOleo'   THEN interval '30 minutes'
                              WHEN 'Revisao'     THEN interval '60 minutes'
                              WHEN 'Diagnostico' THEN interval '90 minutes'
                          END);

-- Chaves estrangeiras: o Postgres não cria índice para FK automaticamente.
CREATE INDEX ix_veiculos_cliente_id     ON veiculos (cliente_id);
CREATE INDEX ix_agendamentos_veiculo_id ON agendamentos (veiculo_id);

-- Listagem de agendamentos: filtro por data (faixa de inicio), por status, e paginação ordenada por inicio.
CREATE INDEX ix_agendamentos_inicio        ON agendamentos (inicio);
CREATE INDEX ix_agendamentos_status_inicio ON agendamentos (status, inicio);

-- Capacidade (máx. 3 serviços simultâneos) e sobreposição: só agendamentos ativos contam.
-- "Ativo" = Agendado ou EmAndamento. Cancelado e Concluido não ocupam vaga. As consultas da BLL usam o mesmo filtro.
CREATE INDEX ix_agendamentos_ativos_periodo ON agendamentos (inicio, fim)
    WHERE status IN ('Agendado', 'EmAndamento');

-- Sobreposição do mesmo veículo garantida também pelo banco (protege contra requisições concorrentes):
-- dois agendamentos ativos do mesmo veículo não podem ter períodos que se cruzem.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE agendamentos ADD CONSTRAINT ex_agendamentos_veiculo_sobreposicao
    EXCLUDE USING gist (veiculo_id WITH =, tstzrange(inicio, fim, '[)') WITH &&)
    WHERE (status IN ('Agendado', 'EmAndamento'));

-- atualizado_em: o DEFAULT now() só vale no INSERT, então sem gatilho a coluna ficaria parada na
-- data de criação depois de qualquer alteração. No banco, e não em cada UPDATE, para valer
-- também para escrita manual e manter o instante sob o relógio do Postgres.
-- A função é genérica: qualquer tabela com a coluna atualizado_em reaproveita o mesmo gatilho.
CREATE FUNCTION set_atualizado_em() RETURNS trigger AS $$
BEGIN
    NEW.atualizado_em := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_clientes_atualizado_em
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER tg_veiculos_atualizado_em
    BEFORE UPDATE ON veiculos
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER tg_agendamentos_atualizado_em
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

COMMIT;

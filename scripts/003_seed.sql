-- 003: dados iniciais para teste.
--
-- As datas são relativas ao momento da execução, para o seed continuar útil em qualquer dia:
-- "próxima segunda" = date_trunc('week', now()) + 1 semana. Horários no fuso da oficina.
-- Os ids são gerados pelo banco, por isso as referências usam e-mail e placa (únicos).

BEGIN;

SET LOCAL TIME ZONE 'America/Sao_Paulo';

-- Telefone só com dígitos, a mesma forma canônica que o value object Telefone grava.
INSERT INTO clientes (nome, telefone, email) VALUES
    ('Ana Souza',    '11988880001', 'ana.souza@email.com'),
    ('Bruno Lima',   '11977770002', 'bruno.lima@email.com'),
    ('Carla Mendes', '21966660003', 'carla.mendes@email.com');

INSERT INTO veiculos (cliente_id, placa, modelo, ano) VALUES
    ((SELECT id FROM clientes WHERE email = 'ana.souza@email.com'),    'ABC1234', 'Fiat Argo',         2021),
    ((SELECT id FROM clientes WHERE email = 'ana.souza@email.com'),    'ABC1D23', 'Volkswagen Polo',   2023),
    ((SELECT id FROM clientes WHERE email = 'bruno.lima@email.com'),   'DEF5678', 'Chevrolet Onix',    2019),
    ((SELECT id FROM clientes WHERE email = 'carla.mendes@email.com'), 'GHI4J56', 'Toyota Corolla',    2024),
    ((SELECT id FROM clientes WHERE email = 'carla.mendes@email.com'), 'JKL9012', 'Honda Civic',       2018);

-- Durações: TrocaOleo 30 min, Revisao 60 min, Diagnostico 90 min.
WITH base AS (
    SELECT date_trunc('week', now()) + interval '1 week' AS proxima_segunda
)
INSERT INTO agendamentos (veiculo_id, inicio, fim, tipo_servico, status, criado_em, atualizado_em)
SELECT v.id, a.inicio, a.inicio + a.duracao, a.tipo_servico, a.status,
       least(now(), a.inicio - interval '3 days'),                       -- criado três dias antes do início (nunca no futuro)
       CASE a.status
           WHEN 'Concluido' THEN a.inicio + a.duracao                     -- concluído ao fim do serviço
           WHEN 'Cancelado' THEN a.inicio - interval '1 day'              -- cancelado na véspera
           ELSE least(now(), a.inicio - interval '3 days')
       END
FROM base,
LATERAL (VALUES
    -- Próxima segunda, 09:00: três serviços simultâneos (capacidade cheia, bom para testar a regra 3).
    ('ABC1234', proxima_segunda + interval '9 hours',                     interval '30 minutes', 'TrocaOleo',   'Agendado'),
    ('DEF5678', proxima_segunda + interval '9 hours',                     interval '60 minutes', 'Revisao',     'Agendado'),
    ('GHI4J56', proxima_segunda + interval '9 hours',                     interval '90 minutes', 'Diagnostico', 'Agendado'),
    -- Próxima segunda à tarde e terça.
    ('ABC1D23', proxima_segunda + interval '14 hours',                    interval '60 minutes', 'Revisao',     'Agendado'),
    ('ABC1234', proxima_segunda + interval '1 day' + interval '8 hours',  interval '30 minutes', 'TrocaOleo',   'Agendado'),
    ('JKL9012', proxima_segunda + interval '1 day' + interval '10 hours', interval '90 minutes', 'Diagnostico', 'Agendado'),
    -- Semana passada: histórico com status finais.
    ('ABC1234', proxima_segunda - interval '2 weeks' + interval '9 hours',                    interval '60 minutes', 'Revisao',   'Concluido'),
    ('DEF5678', proxima_segunda - interval '2 weeks' + interval '1 day' + interval '11 hours', interval '30 minutes', 'TrocaOleo', 'Cancelado')
) AS a (placa, inicio, duracao, tipo_servico, status)
JOIN veiculos v ON v.placa = a.placa;

COMMIT;

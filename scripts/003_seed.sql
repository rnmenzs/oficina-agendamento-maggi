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
-- 004: volume de agendamentos para teste.
--
-- O 003 deixa oito agendamentos, o bastante para ver a tela funcionando e pouco para exercitá-la:
-- não enche uma página, não dá o que filtrar e não põe nada no dia de hoje, que é onde a agenda
-- abre. Este script preenche três semanas em volta de hoje.
--
-- Clientes e veículos próprios, e os agendamentos só usam esses: os veículos do 003 já têm horário
-- marcado, e cruzar as duas fontes no mesmo horário esbarraria na restrição de sobreposição.
--
-- O dia é montado em três pistas paralelas, cada uma com serviços que não se encostam. Assim a
-- capacidade de três simultâneos é respeitada por construção, e não por sorte: nunca há uma quarta
-- pista. Cada pista do dia recebe um veículo diferente, então nenhum carro fica em dois lugares.
--
-- O status não é escrito, é deduzido do relógio: o que já terminou está concluído, o que corre
-- agora está em andamento, o resto segue agendado. O dia é coerente a qualquer hora em que o
-- script rode. Um em cada nove é cancelado, para o quarto status aparecer espalhado.

BEGIN;

SET LOCAL TIME ZONE 'America/Sao_Paulo';

INSERT INTO clientes (nome, telefone, email) VALUES
    ('Diego Rocha',    '11955550004', 'diego.rocha@email.com'),
    ('Elaine Prado',   '11944440005', 'elaine.prado@email.com'),
    ('Fábio Nogueira', '21933330006', 'fabio.nogueira@email.com'),
    ('Gisele Tavares', '31922220007', 'gisele.tavares@email.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO veiculos (cliente_id, placa, modelo, ano)
SELECT c.id, v.placa, v.modelo, v.ano
FROM (VALUES
    ('diego.rocha@email.com',    'MNO6789', 'Jeep Renegade',    2020),
    ('diego.rocha@email.com',    'STU4567', 'Renault Kwid',     2022),
    ('elaine.prado@email.com',   'PQR1S23', 'Fiat Toro',        2022),
    ('elaine.prado@email.com',   'VWX8901', 'Hyundai HB20',     2021),
    ('fabio.nogueira@email.com', 'YZA2B34', 'Nissan Kicks',     2023),
    ('fabio.nogueira@email.com', 'BCD5678', 'Ford Ka',          2017),
    ('gisele.tavares@email.com', 'EFG9H01', 'Peugeot 208',      2024),
    ('gisele.tavares@email.com', 'HIJ2345', 'Citroën C3',       2019)
) AS v (email, placa, modelo, ano)
JOIN clientes c ON c.email = v.email
ON CONFLICT (placa) DO NOTHING;

WITH frota AS (
    SELECT id, row_number() OVER (ORDER BY placa) - 1 AS lugar
    FROM veiculos
    WHERE placa IN ('MNO6789','STU4567','PQR1S23','VWX8901','YZA2B34','BCD5678','EFG9H01','HIJ2345')
),
dias AS (
    -- Domingo a oficina não abre. Dia que já tem agenda também fica de fora: o 003 marca três
    -- serviços às 09:00 da próxima segunda, e encher o mesmo dia estouraria a capacidade de três
    -- simultâneos. De quebra, é o que faz este script poder rodar de novo sem duplicar nada.
    SELECT dia, row_number() OVER (ORDER BY dia) - 1 AS ordem
    FROM generate_series(
        date_trunc('day', now()) - interval '10 days',
        date_trunc('day', now()) + interval '10 days',
        interval '1 day'
    ) AS dia
    WHERE extract(isodow FROM dia) <> 7
      AND NOT EXISTS (
          SELECT 1 FROM agendamentos a WHERE a.inicio >= dia AND a.inicio < dia + interval '1 day'
      )
),
pistas AS (
    -- Pista e a ordem dentro dela. As duas entram no rodízio de veículos: sem a segunda, o mesmo
    -- carro faria os três serviços do dia na mesma pista.
    SELECT * FROM (VALUES
        (0, 0, interval '8 hours',                        interval '60 minutes'),
        (0, 1, interval '10 hours',                       interval '90 minutes'),
        (0, 2, interval '14 hours',                       interval '30 minutes'),
        (1, 0, interval '8 hours' + interval '30 minutes', interval '30 minutes'),
        (1, 1, interval '9 hours' + interval '30 minutes', interval '60 minutes'),
        (1, 2, interval '13 hours',                       interval '90 minutes'),
        (2, 0, interval '9 hours',                        interval '90 minutes'),
        (2, 1, interval '11 hours',                       interval '30 minutes'),
        (2, 2, interval '15 hours',                       interval '60 minutes')
    ) AS p (pista, ordem_na_pista, hora, duracao)
),
marcados AS (
    SELECT d.dia + p.hora AS inicio,
           d.dia + p.hora + p.duracao AS fim,
           p.duracao,
           (d.ordem * 3 + p.pista + p.ordem_na_pista * 3) % (SELECT count(*) FROM frota) AS lugar,
           row_number() OVER (ORDER BY d.dia, p.hora, p.pista) AS n
    FROM dias d
    CROSS JOIN pistas p
    -- Sábado fecha ao meio-dia, e o serviço inteiro tem de caber antes disso.
    WHERE extract(isodow FROM d.dia) <> 6 OR p.hora + p.duracao <= interval '12 hours'
)
INSERT INTO agendamentos (veiculo_id, inicio, fim, tipo_servico, status, criado_em, atualizado_em)
SELECT f.id, m.inicio, m.fim,
       CASE m.duracao
           WHEN interval '30 minutes' THEN 'TrocaOleo'
           WHEN interval '60 minutes' THEN 'Revisao'
           ELSE 'Diagnostico'
       END,
       s.status,
       least(now(), m.inicio - interval '3 days'),                        -- marcado três dias antes (nunca no futuro)
       CASE s.status
           WHEN 'Concluido' THEN m.fim                                    -- concluído ao fim do serviço
           WHEN 'Cancelado' THEN m.inicio - interval '1 day'              -- cancelado na véspera
           ELSE least(now(), m.inicio - interval '3 days')
       END
FROM marcados m
JOIN frota f ON f.lugar = m.lugar
CROSS JOIN LATERAL (
    SELECT CASE
        WHEN m.n % 9 = 0        THEN 'Cancelado'
        WHEN m.fim <= now()     THEN 'Concluido'
        WHEN m.inicio <= now()  THEN 'EmAndamento'
        ELSE 'Agendado'
    END AS status
) s;

-- Um serviço em andamento sempre na tela. Se a hora em que o script rodou não caiu dentro de
-- nenhum — de noite, por exemplo, com o dia inteiro encerrado —, o último que começou hoje fica
-- aberto, que é o que acontece quando ninguém fecha o serviço.
UPDATE agendamentos SET status = 'EmAndamento'
WHERE id = (
    SELECT id FROM agendamentos
    WHERE inicio::date = current_date AND inicio <= now() AND status = 'Concluido'
    ORDER BY inicio DESC
    LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM agendamentos WHERE status = 'EmAndamento');

COMMIT;

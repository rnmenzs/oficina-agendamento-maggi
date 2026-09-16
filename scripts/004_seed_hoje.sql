-- 004: agendamentos de hoje.
--
-- O 003 monta a semana que vem e o histórico das anteriores, mas não põe nada no dia de hoje — e
-- é em hoje que a agenda abre. Sem estas linhas, a primeira tela do sistema é a lista vazia.
--
-- Tudo pela manhã, das 08:00 às 12:00: é a única faixa que vale de segunda a sábado. No domingo a
-- oficina não abre, então o dia escolhido passa a ser a segunda seguinte.
--
-- O status não é escrito, é deduzido do relógio: o que já terminou está concluído, o que está
-- acontecendo agora está em andamento, o resto continua agendado. Assim o dia é coerente a
-- qualquer hora em que o script rode. O cancelado é o único fixo, para o quarto status existir.

BEGIN;

SET LOCAL TIME ZONE 'America/Sao_Paulo';

WITH base AS (
    SELECT CASE extract(isodow FROM now())
        WHEN 7 THEN date_trunc('day', now()) + interval '1 day'
        ELSE date_trunc('day', now())
    END AS dia
),
agenda AS (
    SELECT a.placa,
           a.inicio,
           a.inicio + a.duracao AS fim,
           a.tipo_servico,
           CASE
               WHEN a.cancelado                     THEN 'Cancelado'
               WHEN a.inicio + a.duracao <= now()   THEN 'Concluido'
               WHEN a.inicio <= now()               THEN 'EmAndamento'
               ELSE 'Agendado'
           END AS status
    FROM base,
    LATERAL (VALUES
        -- Dois veículos repetem no dia, em horários que não se cruzam: o mesmo carro pode voltar.
        ('ABC1D23', dia + interval '8 hours',                       interval '30 minutes', 'TrocaOleo',   false),
        ('DEF5678', dia + interval '8 hours' + interval '30 minutes', interval '60 minutes', 'Revisao',     false),
        ('GHI4J56', dia + interval '9 hours',                       interval '90 minutes', 'Diagnostico', false),
        ('ABC1234', dia + interval '9 hours' + interval '30 minutes', interval '30 minutes', 'TrocaOleo',   true),
        ('JKL9012', dia + interval '10 hours',                      interval '60 minutes', 'Revisao',     false),
        ('ABC1D23', dia + interval '10 hours' + interval '30 minutes', interval '90 minutes', 'Diagnostico', false),
        ('DEF5678', dia + interval '11 hours',                      interval '30 minutes', 'TrocaOleo',   false)
    ) AS a (placa, inicio, duracao, tipo_servico, cancelado)
)
INSERT INTO agendamentos (veiculo_id, inicio, fim, tipo_servico, status, criado_em, atualizado_em)
SELECT v.id, g.inicio, g.fim, g.tipo_servico, g.status,
       least(now(), g.inicio - interval '2 days'),                        -- marcado dois dias antes (nunca no futuro)
       CASE g.status
           WHEN 'Concluido' THEN g.fim                                    -- concluído ao fim do serviço
           WHEN 'Cancelado' THEN g.inicio - interval '1 day'              -- cancelado na véspera
           ELSE least(now(), g.inicio - interval '2 days')
       END
FROM agenda g
JOIN veiculos v ON v.placa = g.placa
-- Rodar de novo não duplica o dia: se já existe agendamento na data, o script não tem o que fazer.
WHERE NOT EXISTS (
    SELECT 1 FROM agendamentos x, base b
    WHERE x.inicio >= b.dia AND x.inicio < b.dia + interval '1 day'
);

COMMIT;

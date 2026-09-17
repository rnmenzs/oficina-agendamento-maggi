-- Migration 004: Tabela de usuários para autenticação

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login VARCHAR(50) NOT NULL UNIQUE,
    senha_hash VARCHAR(60) NOT NULL,
    nome VARCHAR(100) NOT NULL
);

-- Insere o usuário admin se não existir.
-- O hash corresponde à senha "admin"
INSERT INTO usuarios (login, senha_hash, nome)
VALUES (
    'admin',
    '$2a$11$ETqhc.3oNTMMzoq5aOd5iuRzCHEpGtlXapa1QRHPnZs7TbRo7lTU6',
    'Administrador'
)
ON CONFLICT (login) DO NOTHING;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telefone TEXT UNIQUE NOT NULL,
    plano TEXT DEFAULT 'gratuito',
    meta_calorias INTEGER DEFAULT 2000,
    analises_restantes INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de refeições
CREATE TABLE IF NOT EXISTS refeicoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    foto_url TEXT NOT NULL,
    descricao TEXT NOT NULL,
    calorias INTEGER NOT NULL,
    carboidratos FLOAT,
    proteinas FLOAT,
    gorduras FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);

-- Tabela de Jejum
CREATE TABLE IF NOT EXISTS jejum (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    inicio TIMESTAMP,
    fim TIMESTAMP,
    duracao_horas INTEGER,
    status TEXT DEFAULT 'em_andamento',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS assinaturas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plano TEXT,
    status TEXT,
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
); 
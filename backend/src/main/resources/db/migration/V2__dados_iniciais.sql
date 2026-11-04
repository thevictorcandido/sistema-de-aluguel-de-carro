-- Dados iniciais, todos fictícios. Senha de todos os usuários: senha123 (hash BCrypt).
-- Os ids vêm do banco; as tabelas filhas buscam o id pelo login.

INSERT INTO usuario (login, senha_hash) VALUES
    ('rotasul', '$2a$10$cRQi65XJN7b2H77huIbBeug5Xig0/OduzStgNtjtPkkJZv0NjiD0.'),
    ('vialeste', '$2a$10$cRQi65XJN7b2H77huIbBeug5Xig0/OduzStgNtjtPkkJZv0NjiD0.'),
    ('horizonte', '$2a$10$cRQi65XJN7b2H77huIbBeug5Xig0/OduzStgNtjtPkkJZv0NjiD0.'),
    ('confianca', '$2a$10$cRQi65XJN7b2H77huIbBeug5Xig0/OduzStgNtjtPkkJZv0NjiD0.'),
    ('marina', '$2a$10$cRQi65XJN7b2H77huIbBeug5Xig0/OduzStgNtjtPkkJZv0NjiD0.'),
    ('joao', '$2a$10$cRQi65XJN7b2H77huIbBeug5Xig0/OduzStgNtjtPkkJZv0NjiD0.');

-- Empresas e bancos aderentes
INSERT INTO agente (id, nome, cnpj)
    SELECT id, 'Locadora Rota Sul', '11.222.333/0001-81' FROM usuario WHERE login = 'rotasul';
INSERT INTO agente (id, nome, cnpj)
    SELECT id, 'Locadora Via Leste', '44.555.666/0001-81' FROM usuario WHERE login = 'vialeste';
INSERT INTO agente (id, nome, cnpj)
    SELECT id, 'Banco Horizonte', '77.888.999/0001-81' FROM usuario WHERE login = 'horizonte';
INSERT INTO agente (id, nome, cnpj)
    SELECT id, 'Banco Confiança', '22.111.444/0001-37' FROM usuario WHERE login = 'confianca';

INSERT INTO empresa (id) SELECT id FROM usuario WHERE login IN ('rotasul', 'vialeste');
INSERT INTO banco (id) SELECT id FROM usuario WHERE login IN ('horizonte', 'confianca');

-- Clientes
INSERT INTO cliente (id, rg, cpf, nome, profissao, logradouro, numero, complemento, bairro, cidade, uf, cep)
    SELECT id, 'MG-12.345.678', '123.456.789-09', 'Marina Costa', 'Enfermeira',
           'Rua da Bahia', '1148', 'ap. 302', 'Centro', 'Belo Horizonte', 'MG', '30160-011'
    FROM usuario WHERE login = 'marina';
INSERT INTO cliente (id, rg, cpf, nome, profissao, logradouro, numero, complemento, bairro, cidade, uf, cep)
    SELECT id, 'MG-98.765.432', '987.654.321-00', 'João Ferreira', 'Analista de sistemas',
           'Avenida Amazonas', '2500', NULL, 'Prado', 'Belo Horizonte', 'MG', '30411-186'
    FROM usuario WHERE login = 'joao';

INSERT INTO rendimento (cliente_id, entidade_empregadora, valor)
    SELECT id, 'Hospital São Lucas', 4200.00 FROM usuario WHERE login = 'marina';
INSERT INTO rendimento (cliente_id, entidade_empregadora, valor)
    SELECT id, 'Clínica Vida Plena', 1300.00 FROM usuario WHERE login = 'marina';
INSERT INTO rendimento (cliente_id, entidade_empregadora, valor)
    SELECT id, 'Construtora Alvorada', 6800.00 FROM usuario WHERE login = 'joao';

-- Automóveis: quem cadastrou é o proprietário inicial
INSERT INTO automovel (matricula, ano, marca, modelo, placa, valor_diaria, proprietario_id)
    SELECT '01234567801', 2024, 'Chevrolet', 'Onix', 'RTA2F41', 180.00, id FROM usuario WHERE login = 'rotasul';
INSERT INTO automovel (matricula, ano, marca, modelo, placa, valor_diaria, proprietario_id)
    SELECT '01234567802', 2023, 'Hyundai', 'HB20', 'QPE7C02', 160.00, id FROM usuario WHERE login = 'rotasul';
INSERT INTO automovel (matricula, ano, marca, modelo, placa, valor_diaria, proprietario_id)
    SELECT '01234567803', 2025, 'Jeep', 'Compass', 'SBC4H19', 350.00, id FROM usuario WHERE login = 'rotasul';
INSERT INTO automovel (matricula, ano, marca, modelo, placa, valor_diaria, proprietario_id)
    SELECT '01234567804', 2024, 'Fiat', 'Argo', 'RTB5D33', 150.00, id FROM usuario WHERE login = 'rotasul';
INSERT INTO automovel (matricula, ano, marca, modelo, placa, valor_diaria, proprietario_id)
    SELECT '01234567805', 2024, 'Volkswagen', 'T-Cross', 'PXA1E87', 260.00, id FROM usuario WHERE login = 'vialeste';
INSERT INTO automovel (matricula, ano, marca, modelo, placa, valor_diaria, proprietario_id)
    SELECT '01234567806', 2025, 'Toyota', 'Corolla', 'SCC9J20', 320.00, id FROM usuario WHERE login = 'vialeste';
INSERT INTO automovel (matricula, ano, marca, modelo, placa, valor_diaria, proprietario_id)
    SELECT '01234567807', 2023, 'Renault', 'Kwid', 'QQF3G56', 120.00, id FROM usuario WHERE login = 'vialeste';
INSERT INTO automovel (matricula, ano, marca, modelo, placa, valor_diaria, proprietario_id)
    SELECT '01234567808', 2024, 'Fiat', 'Toro', 'RTE6K74', 290.00, id FROM usuario WHERE login = 'vialeste';

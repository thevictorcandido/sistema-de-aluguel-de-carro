-- Só no Supabase (perfil supabase). O Supabase publica as tabelas do schema public pela API REST
-- dele, e quem tiver a chave anon leria tudo. Com RLS ligado e sem nenhuma política, essa API
-- não devolve nenhuma linha. A API Spring conecta como dona das tabelas e não é afetada pelo RLS.

ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE agente ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE banco ENABLE ROW LEVEL SECURITY;
ALTER TABLE automovel ENABLE ROW LEVEL SECURITY;
ALTER TABLE parecer ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_aluguel ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrato_credito ENABLE ROW LEVEL SECURITY;

-- flyway_schema_history fica de fora: o Flyway mantém a tabela bloqueada durante a migração, e o
-- ALTER esperaria por ele até o tempo limite do Supabase. Ela só guarda nomes e versões das migrações.

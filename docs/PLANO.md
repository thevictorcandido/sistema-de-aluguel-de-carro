# Plano de construção

Tarefas em ordem de entrega. Cada uma vira uma issue no GitHub e é feita numa branch própria, com um PR que cita a issue (`Closes #N`). Detalhes técnicos na [SPEC](SPEC.md).

As tarefas 3, 4 e 5 cobrem as entregas parciais do enunciado: login (E05), CRUD de cliente (E06) e o protótipo de pedido com status (E07).

## 1. Esqueleto do projeto

- `backend/` gerado no Spring Initializr: Spring Boot 4.0.9, Java 25, Maven, pacote `br.com.aluguelcarros`, com Web, Security, Data JPA, Validation, Flyway, PostgreSQL e H2.
- `frontend/` com Vite, React e React Router; tokens do DESIGN.md em `src/styles/tokens.css`; fontes IBM Plex.
- Proxy do Vite para `/api`; perfis `local` (H2) e `supabase`; `backend/.env.example`.
- `.gitignore`, Biome e GitHub Actions com `mvn verify`, `vitest` e Biome.
- README no template do professor, com como rodar.

**Pronto quando:** `mvn spring-boot:run` e `npm run dev` sobem, a página inicial chama `/api/health` e o CI passa.

## 2. Modelo e banco

- Entidades e enums do diagrama de classes, com as mudanças da SPEC (`valorDiaria`, `getValorTotal`, `getRendaMensal`).
- Migrações Flyway das tabelas e dos dados iniciais.
- Testes de domínio do ciclo do pedido e do limite de rendimentos.
- Diagrama de classes v2 em `docs/uml/v2` e linha nova no `docs/uml/README.md`.

**Pronto quando:** as migrações rodam no H2 e no Supabase, e os testes de domínio passam.

## 3. Login e cadastro (E05, US01, US02)

- API de autenticação com cookie `HttpOnly` e cadastro de cliente.
- Telas Entrar e Criar conta; sessão em contexto; guarda de rotas por perfil.
- Moldura da aplicação com o menu de cada perfil.

**Pronto quando:** cliente cria conta e entra; empresa e banco dos dados iniciais entram; sem login, toda rota volta para Entrar; testes de API para 401 e 403.

## 4. Meus dados (E06, US03, US04)

- Consultar, alterar e excluir o próprio cadastro.
- Rendimentos com no máximo 3, recusados também na API.
- Exclusão bloqueada com pedido ativo, com o motivo na tela.

**Pronto quando:** o CRUD funciona pela tela e os testes de API cobrem o quarto rendimento e a exclusão bloqueada.

## 5. Pedido do cliente (E07, US05, US06)

- Novo pedido: escolher automóvel pela placa, datas e valor calculado.
- Meus pedidos: cartões de contagem por status e tabela.
- Detalhe do pedido com o caminho do pedido.
- Componentes Placa, Selo de status e Caminho do pedido, com testes.

**Pronto quando:** o cliente cria um pedido e o vê como "Aguardando análise"; o pedido de outro cliente responde 404.

## 6. Modificar e cancelar (US07, US08, US09)

- Modificar pedido, com aviso de que o parecer será descartado.
- Cancelar com confirmação.
- Botões somem quando o status não permite; a API responde 409 se forçado.

**Pronto quando:** todas as linhas da tabela de ciclo da SPEC têm teste.

## 7. Fila e análise (US10)

- Fila de pedidos do agente, do mais antigo para o mais novo.
- Análise: cliente, rendimentos, renda comprometida e formulário de parecer.

**Pronto quando:** abrir a análise muda para "Em análise" e o parecer leva a "Aprovado" ou "Reprovado".

## 8. Contrato e crédito (US11, US12)

- Diálogo Executar contrato com os três tipos e os campos de crédito para banco.
- Troca do proprietário do automóvel.
- Tela de contratos do agente.

**Pronto quando:** os três tipos de contrato trocam o proprietário certo e só banco concede crédito.

## 9. Automóveis (US13)

- Tabela e diálogo de cadastro e edição; o agente que cadastra é o proprietário inicial.

**Pronto quando:** matrícula e placa repetidas são recusadas com mensagem no campo.

## 10. Estados e celular

- Carregando, vazio, erro da API, sem permissão, 404 e aviso de ação concluída, conforme o DESIGN.md.
- Layout de celular e navegação por teclado.

**Pronto quando:** cada estado aparece em pelo menos uma tela real e nenhuma tela rola para o lado em 375px.

## 11. Testes ponta a ponta

- Playwright com o fluxo completo: cadastro, login, pedido, análise, aprovação e contrato.

**Pronto quando:** o fluxo passa no perfil `local`, no Chrome e no Firefox.

## 12. Verificação

- Revisão de código, revisão de segurança e teste de autorização entre dois clientes.
- Medição visual no navegador e checklist do fluxo, item a item.

**Pronto quando:** o relatório lista cada item como passou, falhou ou não se aplica, com evidência.

## 13. Entrega final (E08 a E11)

- Diagramas v2 revisados com o código e o feedback das aulas.
- README completo no template do professor.
- Roteiro da apresentação comparando protótipo e modelos.

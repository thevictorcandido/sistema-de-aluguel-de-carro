# Especificação técnica

Como o sistema será construído. Os requisitos vêm das [histórias de usuário](uml/v1/historias-de-usuario.md), e a aparência vem do [DESIGN.md](../DESIGN.md).

## Escopo

Toda a descrição do enunciado, não só o protótipo mínimo: cadastro e login, CRUD de cliente com rendimentos, pedidos com todo o ciclo de status, parecer, contrato, crédito bancário e cadastro de automóveis.

Fora do escopo: deploy, pagamento, e-mail, recuperação de senha e upload de arquivos.

## Arquitetura

```text
Navegador ──> Vite (localhost:5173) ──/api──> Spring Boot (localhost:8080) ──JDBC──> Supabase (PostgreSQL)
```

| Parte | Tecnologia | Onde roda |
|---|---|---|
| Front-end (View) | React 19 + Vite 8, React Router, CSS Modules, `lucide-react` | `frontend/`, local |
| API (Controller e Model) | Java 25, Spring Boot 4.0.9, Spring Web, Spring Security, Spring Data JPA, Bean Validation, Flyway | `backend/`, local |
| Banco | Supabase (PostgreSQL), plano gratuito, conexão pelo pooler | Nuvem |
| Banco de teste | H2 em modo PostgreSQL, perfil `local` | Memória ou arquivo |

O Vite repassa `/api` para a porta 8080. Assim, front e API ficam na mesma origem durante o desenvolvimento, e o CORS não é necessário.

### Pacotes

Seguem o [diagrama de pacotes](uml/v2/pacotes.svg) e a organização dos projetos da disciplina, como o CandidatosTSE_2: sem pacote `dto`.

| Lado | Pacote | Responsabilidade |
|---|---|---|
| Back | `application` | Classe principal, com a varredura dos demais pacotes |
| Back | `config` | Configuração do Spring Security |
| Back | `controller` | Rotas REST, sem regra de negócio |
| Back | `service` | Regras de negócio e verificação de dono |
| Back | `repository` | Spring Data JPA |
| Back | `model` | Entidades JPA, enums e as classes de entrada e saída da API, como o pedido de login |
| Back | `security` | Geração e leitura do JWT e o filtro que o confere |
| Back | `exception` | Erros de negócio e o tratador global |
| Front | `routes` | Rotas e guarda por perfil |
| Front | `pages` | Uma pasta por tela do DESIGN.md |
| Front | `components` | Placa, selo de status, caminho do pedido, tabela, campos, diálogo |
| Front | `contexts` | Sessão do usuário |
| Front | `services` | Cliente HTTP da API |

### Configuração

Variáveis de ambiente, com modelo em `backend/.env.example`. O `.env` não vai para o git.

| Variável | Uso |
|---|---|
| `DB_URL` | JDBC do pooler do Supabase |
| `DB_USER`, `DB_PASSWORD` | Credenciais do banco |
| `JWT_SECRET` | Chave de assinatura do token, com 32 bytes ou mais |

Sem essas variáveis, o perfil `local` sobe com H2 e os mesmos dados iniciais, para quem for corrigir conseguir rodar sem criar um projeto no Supabase.

## Persistência

- Tabelas criadas pelo Flyway, em `backend/src/main/resources/db/migration`. O Hibernate só valida (`ddl-auto=validate`).
- SQL comum a PostgreSQL e H2, para as mesmas migrações rodarem nos dois.
- Herança de `Usuario` com estratégia `JOINED`: tabelas `usuario`, `cliente`, `agente`, `empresa` e `banco`.
- `Endereco` como `@Embeddable` dentro de `cliente`.
- Dados iniciais numa migração própria: 2 empresas, 2 bancos, 2 clientes de teste e 8 automóveis, todos com dados fictícios. As senhas de teste ficam no README.

## Autenticação e autorização

- `POST /api/auth/login` confere a senha com BCrypt e devolve um JWT num cookie `HttpOnly`, `SameSite=Strict`, válido por 8 horas. O JavaScript do navegador não lê o token.
- `POST /api/auth/logout` apaga o cookie. `GET /api/auth/me` devolve id, nome e perfil.
- Toda rota fora de `/api/auth/**` e `POST /api/clientes` exige login.
- O perfil decide a rota: `CLIENTE`, `EMPRESA` ou `BANCO`. `@PreAuthorize` nos controllers.
- O dono decide o dado: o serviço confere que o pedido pertence ao cliente logado. Pedido de outro cliente responde 404, para não revelar que existe.
- Erro de login responde só "Usuário ou senha incorretos".

## API

| Método | Rota | Perfil | História |
|---|---|---|---|
| POST | `/api/auth/login` | Público | US02 |
| POST | `/api/auth/logout` | Logado | US02 |
| GET | `/api/auth/me` | Logado | US02 |
| POST | `/api/clientes` | Público | US01 |
| GET, PUT, DELETE | `/api/clientes/me` | Cliente | US03 |
| GET, POST | `/api/clientes/me/rendimentos` | Cliente | US04 |
| PUT, DELETE | `/api/clientes/me/rendimentos/{id}` | Cliente | US04 |
| GET | `/api/automoveis` | Logado | US05, US13 |
| POST, PUT, DELETE | `/api/automoveis[/{id}]` | Agente | US13 |
| GET, POST | `/api/pedidos` | Cliente vê os seus; agente vê todos | US05, US06, US10 |
| GET, PUT | `/api/pedidos/{id}` | Dono ou agente | US06, US07, US09 |
| POST | `/api/pedidos/{id}/cancelar` | Dono | US08 |
| POST | `/api/pedidos/{id}/analise` | Agente | US10 |
| POST | `/api/pedidos/{id}/parecer` | Agente | US10 |
| POST | `/api/pedidos/{id}/contrato` | Agente | US11, US12 |
| GET | `/api/contratos` | Agente | US11, US12 |

Erros no formato `{ "mensagem": "...", "campos": { "campo": "erro" } }`, com 400 para validação, 401 sem login, 403 sem permissão, 404 não encontrado e 409 para regra de negócio violada, como status que não permite a ação.

## Regras de negócio

### Ciclo do pedido

| De | Ação | Para | Quem |
|---|---|---|---|
| — | Criar | `ENVIADO` | Cliente |
| `ENVIADO` | Abrir análise | `EM_ANALISE` | Agente |
| `EM_ANALISE` | Parecer favorável | `APROVADO` | Agente |
| `EM_ANALISE` | Parecer desfavorável | `REPROVADO` | Agente |
| `APROVADO` | Executar contrato | `CONTRATADO` | Agente |
| `ENVIADO`, `EM_ANALISE`, `APROVADO`, `REPROVADO` | Modificar | `ENVIADO`, e o parecer é apagado | Cliente dono ou agente |
| `ENVIADO`, `EM_ANALISE`, `APROVADO`, `REPROVADO` | Cancelar | `CANCELADO` | Cliente dono |

As transições ficam em métodos de `PedidoAluguel`, como no diagrama de classes, e lançam erro de negócio quando o status não permite.

### Outras regras

- Data de fim igual ou posterior à de início; início a partir de hoje.
- No máximo 3 rendimentos por cliente, conferido no serviço.
- Login, CPF, RG, matrícula e placa únicos.
- Cliente com pedido em `ENVIADO`, `EM_ANALISE` ou `APROVADO` não pode ser excluído. Com pedido `CONTRATADO` também não, porque o contrato e o proprietário do automóvel precisam ficar no histórico. Ao excluir, os pedidos `CANCELADO` e `REPROVADO` são apagados junto. A tela mostra o motivo antes de a pessoa tentar.
- Contrato `PROPRIEDADE_BANCO` só por banco, e com crédito obrigatório. Os outros tipos aceitam crédito opcional de banco.
- Ao contratar, o proprietário do automóvel muda conforme o tipo do contrato (US11).

### Valor e renda comprometida

Para mostrar a renda comprometida na análise, como o DESIGN.md propõe:

- `Automovel` ganha `valorDiaria: BigDecimal`.
- `PedidoAluguel` calcula `getValorTotal()`: diárias, contando início e fim, vezes `valorDiaria` do automóvel.
- A análise mostra `valorTotal / soma dos rendimentos`, com a referência fixa de 30%. A referência é só informação para o agente: o sistema não aprova nem reprova sozinho.

## Mudanças no modelo para a v2 dos diagramas

A nota olha o alinhamento entre modelo e código. Cada mudança abaixo entra em `docs/uml/v2` na mesma tarefa que a implementa. As da tarefa 2 já estão no diagrama v2.

| Classe | Mudança | Motivo |
|---|---|---|
| `Automovel` | `+ valorDiaria: BigDecimal` | Valor do pedido e renda comprometida |
| `PedidoAluguel` | `+ getValorTotal(): BigDecimal` | Idem |
| `Cliente` | `+ getRendaMensal(): BigDecimal` | Idem |
| `Usuario` | `+ getNome(): String`, abstrato | Nome do cliente, da empresa ou do banco nas telas |
| `StatusPedido` | `+ permiteAlteracao()` e `+ ativo()` | Regras de modificar, cancelar e excluir cliente num lugar só |

## Testes e qualidade

| Camada | Ferramenta | O que cobre |
|---|---|---|
| Domínio | JUnit 5 | Todas as transições do ciclo, limite de rendimentos, valor total |
| API | Spring Boot Test + MockMvc, perfil `local` | Cada rota com o perfil certo, o errado e sem login; pedido de outro cliente |
| Front | Vitest + Testing Library | Componentes de placa, status e caminho; formulários com erro |
| Ponta a ponta | Playwright | Cadastro, login, criar pedido, analisar, aprovar, contratar |
| Estilo | Biome no front | Formatação e lint |

O GitHub Actions roda `mvn verify`, `vitest` e Biome em cada PR. O Playwright roda localmente, com o perfil `local`.

## Pontos em aberto

| # | Ponto | Proposta até decidirem o contrário |
|---|---|---|
| 1 | Limite de tentativas de login | Fora do escopo, por não haver deploy; registrar no README |
| 2 | Backup do Supabase | O plano gratuito não guarda backups; as migrações e os dados iniciais recriam o banco |
| 3 | Valor da diária e referência de 30% | Valores de exemplo nos dados iniciais, mostrados ao professor junto com a v2 |

## Decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-04 | Exclusão de cliente bloqueada também por contrato executado | O enunciado só fala em pedido ativo, mas apagar o cliente apagaria o contrato e o registro de propriedade do automóvel |
| 2026-11-04 | Sem pacote `dto`; classe principal em `application` e `SecurityConfig` em `config` | Seguir a organização usada nas aulas e na prova (CandidatosTSE_2, BD_RestAPI_PostgreSQL, JWT_RestAPI). As classes de entrada e saída ficam em `model`, como o `LoginRequest` do JWT_RestAPI, e nunca levam o hash da senha |

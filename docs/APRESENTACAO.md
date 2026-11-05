# Roteiro da Apresentação

Roteiro para a apresentação final do Laboratório 02 de DIAW, comparando o sistema em execução com as versões dos modelos UML ([v1](uml/v1), [v2](uml/v2) e [v3](uml/v3)) e explicando as modificações feitas ao longo do desenvolvimento.

---

## 1. Preparação antes de abrir a tela

Subir a API e o front-end em dois terminais:

```bash
# Terminal 1: API na porta 8080 (perfil local com H2 ou perfil supabase)
cd backend
./mvnw spring-boot:run

# Terminal 2: Front-end em http://127.0.0.1:5173
cd frontend
npm run dev
```

Contas dos dados iniciais (`V2__dados_iniciais.sql`), todas com a senha `senha123`:

| Login | Perfil | Nome | Uso na demonstração |
|---|---|---|---|
| `marina` | Cliente | Marina Costa | Criar e modificar pedido, mostrar rendimentos e bloqueio de exclusão |
| `joao` | Cliente | João Ferreira | Mostrar que um cliente não vê nem altera o pedido de outro (`404`) |
| `rotasul` | Empresa | Locadora Rota Sul | Analisar pedido, emitir parecer, executar contrato e manter automóveis |
| `horizonte` | Banco | Banco Horizonte | Executar contrato com concessão de crédito bancário |

Deixar abertas em abas separadas:
1. A aplicação em `http://127.0.0.1:5173`
2. O histórico dos modelos em [`docs/uml/README.md`](uml/README.md)

---

## 2. Arquitetura MVC e evolução do Diagrama de Pacotes (`v1` → `v2` → `v3`)

O enunciado divide o sistema em dois subsistemas sob arquitetura MVC:
- **Construção dinâmica das páginas web** (`frontend/`, React + Vite): cumpre o papel de **View**, consumindo a API REST em JSON.
- **Gestão de pedidos e contratos** (`backend/`, Spring Boot): `controller` é o **Controller**; `service`, `repository` e `model` formam o **Model**.

### O que mudou entre as versões do diagrama de pacotes

| Versão | Mudança no diagrama de pacotes | Motivo |
|---|---|---|
| **v1 → v2** | Saída do pacote `dto`; entrada dos pacotes `application` e `config` no back-end | Seguir a organização adotada nos projetos da disciplina (`CandidatosTSE_2`, `BD_RestAPI_PostgreSQL`, `JWT_RestAPI`). A classe principal fica em `application` com `@EntityScan` e `@EnableJpaRepositories`, `SecurityConfig` e `RelogioConfig` ficam em `config`, e os records de entrada e saída (`*Request` e `*Response`) ficam em `model`, sem nunca expor `senhaHash` |
| **v2 → v3** | Em `backend`: `security` aponta para `model` (sem ir a `repository`), `controller` e `service` dependem de `security`, e `exception` depende de `model` | Na implementação do JWT (`JwtUtil` e `JwtFilter`), o `id` e o `perfil` do usuário vão assinados no próprio token dentro de um cookie `HttpOnly`. Assim, o filtro autentica cada requisição sem consultar o banco, entregando um `UsuarioAutenticado` aos controllers e serviços. Já `GlobalExceptionHandler` devolve `ErroResponse` (em `model`) |
| **v2 → v3** | Em `frontend`: entrada do pacote `utils` e ligações de `routes` com `components` e `contexts` | As formatações de moeda, datas e documentos (`formatos.js`), o título por tela (`useTituloPagina.js`) e a limpeza de avisos de navegação (`useAvisoDeNavegacao.js`) foram reunidos em `src/utils/`. A guarda `RotaProtegida` em `routes` lê a sessão de `contexts` e envolve as telas autenticadas na `Moldura` |

---

## 3. Evolução do Diagrama de Classes (`v1` → `v2` → `v3`) e alinhamento com o código

As onze entidades e três enums modelados na `v1` permaneceram no código final, com a mesma hierarquia `JOINED` para `Usuario` (`Cliente` e `Agente`, especializado em `Empresa` e `Banco`) e `Endereco` como `@Embeddable`. As mudanças abaixo entraram para sustentar as regras de negócio e a interface:

| Versão | Classe | Mudança inserida | Motivo e onde está no código |
|---|---|---|---|
| **v2** | `Automovel` | Atributo `- valorDiaria: BigDecimal` | Calcular o valor do pedido e a proporção sobre a renda na análise financeira (`Automovel.java`) |
| **v2** | `PedidoAluguel` | Método `+ getValorTotal(): BigDecimal` | Multiplica o número de diárias (incluindo início e fim) pelo `valorDiaria` do automóvel (`PedidoAluguel.java`) |
| **v2** | `Cliente` | Método `+ getRendaMensal(): BigDecimal` | Soma os até 3 rendimentos do cliente para a ficha financeira vista pelo agente (`Cliente.java`) |
| **v2** | `Usuario` | Método `+ {abstract} getNome(): String` | Permite exibir o nome do proprietário atual do automóvel (cliente, empresa ou banco) e o nome na sessão sem `instanceof` (`Usuario.java`) |
| **v2** | `StatusPedido` | Métodos `+ permiteAlteracao(): boolean` e `+ ativo(): boolean` | Concentra no enum quais status permitem modificar/cancelar (`!= CONTRATADO && != CANCELADO`) e quais caracterizam pedido em andamento (`StatusPedido.java`) |
| **v3** | `Cliente` | Constante `MAXIMO_RENDIMENTOS = 3`, `+ removerRendimento(r)` e `+ atualizarDados(...)` | Completar o CRUD da tela Meus dados, mantendo a invariante dos 3 rendimentos dentro da entidade (`Cliente.java`) |
| **v3** | `Rendimento` | Método `+ atualizar(entidadeEmpregadora, valor)` | Permitir editar um rendimento já cadastrado sem recriar o registro (`Rendimento.java`) |
| **v3** | `Automovel` | Método `+ atualizar(matricula, ano, marca, modelo, placa, valorDiaria)` | Permitir que o agente proprietário atualize os dados do veículo (`Automovel.java`) |
| **v3** | `PedidoAluguel` | Método `+ exigirAlteravel(acao: String)` | Impedir modificação ou cancelamento de pedidos já contratados ou cancelados antes de alterar o estado (`PedidoAluguel.java`) |
| **v3** | `Contrato` | Método `~ associarCredito(credito: ContratoCredito)` | Garantir no domínio que um contrato de aluguel receba no máximo um contrato de crédito (`Contrato.java`, chamado por `Banco.concederCredito`) |

### Refinamentos de regras nas Histórias de Usuário (`v1` → `v3`)

Durante a implementação e a verificação (tarefa 12), quatro regras das histórias de usuário foram detalhadas na [v3 das histórias](uml/v3/historias-de-usuario.md):

1. **Unicidade e validação no cadastro (US01, US03):** além de login e CPF únicos, o RG também é único e o CPF tem seus dois dígitos verificadores conferidos no serviço.
2. **Exclusão de cliente e histórico de contratos (US03):** além de bloquear a exclusão quando há pedido ativo (`ENVIADO`, `EM_ANALISE`, `APROVADO`), o sistema também bloqueia quando há pedido `CONTRATADO`, evitando apagar contratos executados ou deixar automóveis sem proprietário. Pedidos `CANCELADO` e `REPROVADO` são removidos junto com a conta.
3. **Abertura explícita da análise (US10):** o pedido só passa de `ENVIADO` para `EM_ANALISE` quando o agente aciona "Analisar" (`POST /api/pedidos/{id}/analise`), e não pela simples leitura da tela.
4. **Propriedade do automóvel no contrato e no cadastro (US11, US13):**
   - Em `PROPRIEDADE_EMPRESA`, além de exigir que o agente seja uma empresa, o serviço confere se o automóvel já pertence a essa empresa — impedindo que uma empresa tome pelo contrato o carro cadastrado por outra.
   - Na tela de Automóveis, só o proprietário atual pode editar ou excluir o veículo, e veículos que já aparecem em pedidos não podem ser excluídos.

---

## 4. Roteiro de demonstração no protótipo

### Passo 1 — Bloqueio de acesso sem login e autenticação (E05 / US01, US02)

1. Abrir `http://127.0.0.1:5173/pedidos` sem sessão: mostrar que o sistema redireciona para `/entrar`.
2. Tentar entrar com senha errada: mostrar a mensagem única `"Usuário ou senha incorretos"` (sem revelar se o login existe).
3. Entrar com `marina` / `senha123`: mostrar o cookie `HttpOnly` no DevTools (aba Application > Cookies) e o menu específico do perfil Cliente (`Meus pedidos`, `Novo pedido`, `Meus dados`).

### Passo 2 — CRUD de Cliente e limite de 3 rendimentos (E06 / US03, US04)

1. Abrir **Meus dados**: mostrar dados cadastrais (RG, CPF, nome, profissão) e endereço embutido.
2. Na seção **Rendimentos**: mostrar os 2 rendimentos iniciais da Marina, adicionar um 3º rendimento e observar o contador `"3 de 3"` e o ocultamento do botão de adicionar (se chamado via API, o back-end responde `409`).
3. Na seção **Excluir conta**: mostrar como funciona a verificação — se houver pedido em andamento ou contrato executado, o botão aparece desativado com o motivo explícito.

### Passo 3 — Criação, consulta e modificação de pedido pelo cliente (E07 / US05, US06, US07, US08)

1. Abrir **Novo pedido**: escolher um automóvel (mostrado com a placa padrão Mercosul e o valor da diária) e informar o período. Mostrar o cálculo imediato das diárias e do valor total.
2. Enviar o pedido: mostrar que nasce como **Aguardando análise** (`ENVIADO`) e exibe o **Caminho do pedido** (`Enviado → Em análise → Aprovado → Contratado`).
3. Em outra janela anônima, entrar com `joao` / `senha123` e tentar abrir a URL do pedido da Marina (`/pedidos/1`): mostrar que responde **Página não encontrada** (`404`), protegendo os dados entre clientes.

### Passo 4 — Fila de pedidos e análise financeira pelo agente (US09, US10)

1. Sair e entrar como empresa: `rotasul` / `senha123`.
2. Na **Fila de pedidos**: mostrar que a fila abre filtrada em "Aguardando análise", ordenada do mais antigo para o mais novo.
3. Clicar em **Analisar**: o status muda para **Em análise** (`EM_ANALISE`).
4. Mostrar os blocos da tela de análise:
   - Dados do cliente e endereço;
   - Rendimentos e renda mensal total;
   - Proporção do valor do aluguel sobre a renda mensal, com a referência informativa de 30%;
   - Formulário de parecer: registrar parecer **Favorável** com justificativa e mostrar a transição para **Aprovado** (`APROVADO`).
5. *(Observação para destacar ao professor)*: se o cliente ou o agente modificar o automóvel ou as datas de um pedido já avaliado, o sistema avisa antes, descarta o parecer e devolve o pedido para `ENVIADO`.

### Passo 5 — Execução de contrato, crédito bancário e propriedade do automóvel (US11, US12, US13)

1. Sair da empresa e entrar como banco: `horizonte` / `senha123`.
2. Abrir o pedido aprovado e clicar em **Executar contrato**:
   - Mostrar as três opções de propriedade com os nomes reais: cliente (`Marina Costa`), empresa (disponível apenas para a empresa dona do carro) e banco (`Banco Horizonte`).
   - Escolher a opção com financiamento ou propriedade do banco e preencher o **Contrato de crédito**: valor financiado, taxa de juros mensal e número de parcelas.
   - Confirmar: o pedido vai a **Contratado** (`CONTRATADO`) e o contrato passa a aparecer na tela **Contratos e créditos**.
3. Abrir **Automóveis**: mostrar que o proprietário do automóvel contratado mudou automaticamente na tabela, e que o agente pode cadastrar novos veículos ou editar apenas aqueles de que é proprietário.

---

## 5. Qualidade e verificação

Se o professor quiser ver os testes e a verificação:
- **Back-end (`cd backend && ./mvnw verify`):** 130 testes com JUnit 5 e MockMvc cobrindo todas as transições do ciclo do pedido, limites de rendimentos, regras de contrato e crédito, permissões por perfil e isolamento entre clientes.
- **Front-end (`cd frontend && npm test`):** 67 testes com Vitest e Testing Library.
- **Ponta a ponta (`cd frontend && npm run e2e`):** 6 fluxos completos no Playwright, executados no Chromium e no Firefox.
- **Relatório completo:** [`docs/VERIFICACAO.md`](VERIFICACAO.md).

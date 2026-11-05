# Histórias de Usuário (v3)

Cada história aponta para o caso de uso (UC) do [diagrama de casos de uso](casos-de-uso.svg). Esta versão consolida os critérios de aceitação implementados no código final.

## Acesso

### US01 - Cadastrar conta de cliente (UC01)

Como cliente, quero criar uma conta para poder usar o sistema.

- Login, CPF e RG são únicos; o CPF tem seus dígitos verificadores validados.
- Sem cadastro e login, nenhuma tela além de Entrar e Criar conta fica acessível.
- Empresas e bancos aderentes já existem nos dados iniciais do sistema.

### US02 - Entrar no sistema (UC02)

Como cliente ou agente, quero entrar com usuário e senha para acessar as funções do meu perfil.

- Credenciais inválidas mostram apenas "Usuário ou senha incorretos", com tempo de resposta constante (BCrypt executado mesmo quando o usuário não existe).
- A senha é guardada apenas como hash BCrypt, e a sessão usa JWT em cookie `HttpOnly` (`SameSite=Strict`).
- O menu e a API respeitam o perfil do usuário (`CLIENTE`, `EMPRESA` ou `BANCO`).

## Cliente

### US03 - Manter meus dados (UC03)

Como cliente, quero consultar, alterar e excluir meus dados para mantê-los corretos.

- Dados guardados: RG, CPF, nome, endereço e profissão.
- A exclusão é recusada enquanto houver pedido ativo (`ENVIADO`, `EM_ANALISE`, `APROVADO`) ou contrato executado (`CONTRATADO`), preservando o histórico de contratos e de propriedade dos automóveis.
- Quando a exclusão é permitida, eventuais pedidos `CANCELADO` ou `REPROVADO` do cliente são removidos junto com a conta, e o cookie da sessão é apagado.

### US04 - Informar rendimentos (UC04)

Como cliente, quero informar, alterar e remover empregadores e rendimentos para embasar a análise financeira.

- São aceitos no máximo 3 registros, cada um com a entidade empregadora e o valor mensal.
- A API recusa um quarto registro com erro de negócio (`409`), mesmo que o front-end seja contornado.

### US05 - Criar pedido (UC05)

Como cliente, quero introduzir um pedido de aluguel para solicitar um automóvel.

- O pedido indica automóvel, data de início e data de fim.
- A data de início deve ser igual ou posterior a hoje (no fuso de Brasília), e a data de fim não pode ser anterior à de início.
- O valor total do pedido é calculado pelas diárias (incluindo início e fim) multiplicadas pelo `valorDiaria` do automóvel.
- O pedido nasce com status `ENVIADO`.

### US06 - Consultar pedidos (UC07)

Como cliente, quero ver meus pedidos e o status de cada um para acompanhar a análise.

- O cliente vê somente os próprios pedidos, com contadores por status e o caminho do pedido.
- Consultar, modificar ou cancelar por URL ou API o pedido de outro cliente responde `404`, sem revelar que o pedido existe.

### US07 - Modificar pedido (UC06)

Como cliente, quero modificar meu pedido para corrigir automóvel ou datas.

- Só é possível antes de o pedido chegar a `CONTRATADO` ou `CANCELADO`.
- Modificar um pedido `EM_ANALISE`, `APROVADO` ou `REPROVADO` o devolve para `ENVIADO`, e o parecer anterior é descartado após confirmação na tela.

### US08 - Cancelar pedido (UC08)

Como cliente, quero cancelar meu pedido quando desistir do aluguel.

- Só é possível antes de `CONTRATADO` ou `CANCELADO`.
- O pedido fica com status `CANCELADO` e continua no histórico.

## Agente

### US09 - Modificar pedido como agente (UC06)

Como agente, quero modificar um pedido para ajustar suas condições durante a análise.

- As mesmas restrições de status e descarte de parecer da US07 se aplicam.

### US10 - Avaliar pedido (UC09)

Como agente, quero avaliar financeiramente um pedido para dar um parecer.

- A fila mostra os pedidos do mais antigo para o mais novo.
- Iniciar a análise é uma ação explícita do agente ("Analisar") sobre um pedido `ENVIADO`, mudando o status para `EM_ANALISE`.
- A tela de análise apresenta a ficha financeira do cliente: rendimentos, renda mensal total e proporção do aluguel sobre a renda, com referência informativa de 30%.
- O parecer guarda agente, resultado, justificativa obrigatória e data.
- Parecer favorável leva a `APROVADO`; desfavorável leva a `REPROVADO`.

### US11 - Executar contrato (UC10, UC13)

Como agente, quero executar o contrato de um pedido aprovado para concretizar o aluguel.

- Apenas pedidos `APROVADO` podem ser contratados.
- O tipo do contrato define o proprietário do automóvel:
  - `PROPRIEDADE_CLIENTE`: o cliente do pedido.
  - `PROPRIEDADE_EMPRESA`: a empresa que executou o contrato, permitido somente quando o agente é uma empresa e já é a proprietária atual do automóvel.
  - `PROPRIEDADE_BANCO`: o banco que executou o contrato e concedeu o crédito, obrigatório nesse tipo.
- O pedido passa a `CONTRATADO`.

### US12 - Conceder crédito (UC11)

Como banco, quero associar um contrato de crédito ao aluguel para financiá-lo.

- O crédito só pode ser concedido por um banco: é opcional nos contratos `PROPRIEDADE_CLIENTE` e obrigatório em `PROPRIEDADE_BANCO`.
- Cada contrato de aluguel tem no máximo um contrato de crédito, com valor, taxa de juros mensal e número de parcelas.

### US13 - Manter automóveis (UC12)

Como agente, quero cadastrar e manter automóveis para que possam ser pedidos.

- Dados guardados: matrícula, ano, marca, modelo, placa e valor da diária.
- Matrícula e placa são únicas.
- O agente que cadastra o automóvel é o proprietário inicial.
- Apenas o proprietário atual pode editar ou excluir o automóvel, e automóveis que já aparecem em pedidos não podem ser excluídos.

## Rastreabilidade

| História | Requisitos |
|---|---|
| US01 | RF01, RF03 |
| US02 | RF02, RF03 |
| US03 | RF04, RF05 |
| US04 | RF06 |
| US05 | RF07 |
| US06 | RF09 |
| US07 | RF08 |
| US08 | RF10 |
| US09 | RF08 |
| US10 | RF11 |
| US11 | RF12, RF14 |
| US12 | RF15 |
| US13 | RF13 |

# Histórias de Usuário (v1)

Cada história aponta para o caso de uso (UC) do [diagrama de casos de uso](casos-de-uso.svg).

## Acesso

### US01 - Cadastrar conta de cliente (UC01)

Como cliente, quero criar uma conta para poder usar o sistema.

- Login e CPF são únicos.
- Sem cadastro, nenhuma tela além de login e cadastro fica acessível.
- Empresas e bancos aderentes já existem nos dados iniciais do sistema.

### US02 - Entrar no sistema (UC02)

Como cliente ou agente, quero entrar com usuário e senha para acessar as funções do meu perfil.

- Credenciais inválidas mostram erro sem dizer qual campo errou.
- A senha é guardada apenas como hash.
- O menu e a API respeitam o perfil do usuário.

## Cliente

### US03 - Manter meus dados (UC03)

Como cliente, quero consultar, alterar e excluir meus dados para mantê-los corretos.

- Dados guardados: RG, CPF, nome, endereço e profissão.
- A exclusão é recusada enquanto houver pedido ativo.

### US04 - Informar rendimentos (UC04)

Como cliente, quero informar empregadores e rendimentos para embasar a análise financeira.

- São aceitos no máximo 3 registros, com a entidade empregadora e o valor.
- A API recusa um quarto registro, mesmo que o front-end seja contornado.

### US05 - Criar pedido (UC05)

Como cliente, quero introduzir um pedido de aluguel para solicitar um automóvel.

- O pedido indica automóvel, data de início e data de fim.
- A data de fim não pode ser anterior à de início.
- O pedido nasce com status `ENVIADO`.

### US06 - Consultar pedidos (UC07)

Como cliente, quero ver meus pedidos e o status de cada um para acompanhar a análise.

- O cliente vê somente os próprios pedidos.
- Pedir por URL ou API o pedido de outro cliente é recusado.

### US07 - Modificar pedido (UC06)

Como cliente, quero modificar meu pedido para corrigir automóvel ou datas.

- Só é possível antes de o pedido chegar a `CONTRATADO` ou `CANCELADO`.
- Modificar um pedido `APROVADO` ou `REPROVADO` o devolve para `ENVIADO`, e o parecer anterior é descartado.

### US08 - Cancelar pedido (UC08)

Como cliente, quero cancelar meu pedido quando desistir do aluguel.

- Só é possível antes de `CONTRATADO`.
- O pedido fica com status `CANCELADO` e continua no histórico.

## Agente

### US09 - Modificar pedido como agente (UC06)

Como agente, quero modificar um pedido para ajustar suas condições durante a análise.

- As mesmas restrições de status da US07 se aplicam.

### US10 - Avaliar pedido (UC09)

Como agente, quero avaliar financeiramente um pedido para dar um parecer.

- O agente vê os pedidos pendentes com os rendimentos do cliente.
- Abrir a análise muda o status para `EM_ANALISE`.
- O parecer guarda agente, resultado, justificativa e data.
- Parecer positivo leva a `APROVADO`; negativo leva a `REPROVADO`.

### US11 - Executar contrato (UC10, UC13)

Como agente, quero executar o contrato de um pedido aprovado para concretizar o aluguel.

- Apenas pedidos `APROVADO` podem ser contratados.
- O tipo do contrato define o proprietário do automóvel:
  - `PROPRIEDADE_CLIENTE`: o cliente do pedido.
  - `PROPRIEDADE_EMPRESA`: a empresa que executou o contrato.
  - `PROPRIEDADE_BANCO`: o banco que concedeu o crédito, obrigatório nesse tipo.
- O pedido passa a `CONTRATADO`.

### US12 - Conceder crédito (UC11)

Como banco, quero associar um contrato de crédito ao aluguel para financiá-lo.

- O crédito é opcional e só pode ser concedido por um banco.
- Cada contrato de aluguel tem no máximo um contrato de crédito.

### US13 - Manter automóveis (UC12)

Como agente, quero cadastrar e manter automóveis para que possam ser pedidos.

- Dados guardados: matrícula, ano, marca, modelo e placa.
- Matrícula e placa são únicas.
- O agente que cadastra o automóvel é o proprietário inicial.

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

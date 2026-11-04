# DESIGN.md

Direção visual do front-end em React + Vite. Vale para todas as telas. Aprovada em 2026-11-03.

## A ideia

**Neste sistema, a placa do automóvel e o caminho do pedido são a identidade da tela.**

Todo automóvel aparece como a sua placa Mercosul desenhada, com a faixa azul e os caracteres no tamanho de leitura. Todo pedido mostra em que ponto do caminho está: `Enviado → Em análise → Aprovado → Contratado`. O resto da interface fica neutro, para que essas duas coisas se destaquem.

## Princípios

- Ferramenta de trabalho, sem efeitos: nada se mexe além do retorno de botões, abertura de menus e diálogos.
- A cor vai para os dados, não para a moldura. Menos de 3% da tela tem cor; o status do pedido é a principal fonte de cor.
- Cada tela responde uma pergunta antes das outras (veja [Telas](#telas)) e tem a ação principal a um clique.
- Superfícies planas: separação por um passo de tom ou uma borda de 1px, sem sombra em nada parado. Sombra só no que flutua, como menu e diálogo.
- Sem gradiente, brilho, vidro, emoji, ícone em quadrado colorido ou número inventado.
- Textos em português, em linguagem do negócio: "Aguardando análise", "Parecer do agente", "Contrato executado", nunca "Item" ou "Registro".

## Estrutura da aplicação

Uma moldura em L, tingida, segura a barra lateral e a barra superior, sem linha entre elas. O conteúdo fica numa folha branca recuada 8px das bordas direita e inferior da janela, com borda de 1px, cantos de 16px e sem sombra.

| Parte | Medida | Conteúdo |
|---|---|---|
| Barra lateral | 228px | Marca no topo, links do perfil, conta no rodapé |
| Barra superior | 48px | Busca centrada (placa, nome ou nº do pedido), botão da conta |
| Folha | Recuo de 8px, raio 16px, preenchimento 24px | Título da tela, depois o conteúdo |

A marca é um monograma desenhado para o sistema: uma placa em miniatura com as letras `AC` (Aluguel de Carros), na cor de destaque. O nome ao lado: **Aluguel de Carros**.

Menu por perfil:

| Cliente | Empresa | Banco |
|---|---|---|
| Meus pedidos | Fila de pedidos | Fila de pedidos |
| Novo pedido | Contratos | Contratos e créditos |
| Meus dados | Automóveis | Automóveis |

O item ativo é o texto em tinta com fundo `--active`; os demais ficam em `--muted`.

## Cores

| Token | Cor | Uso |
|---|---|---|
| `--ground` | `#f9fbfc` | Moldura em L |
| `--surface` | `#ffffff` | Folha e cartões |
| `--raised` | `#f4f6f8` | Painéis internos, linha em foco |
| `--active` | `#ebedee` | Item de menu ativo |
| `--border` | `#e8eaec` | Borda da folha e dos cartões |
| `--rule` | `#f0f1f2` | Linhas de tabela |
| `--control` | `#cdced1` | Borda de campos |
| `--text` | `#131416` | Texto |
| `--muted` | `#5d5f60` | Texto secundário |
| `--accent` | `#1b6c80` | Botão principal, aba ativa, marca, foco |
| `--positive` | `#1e7b4f` | Aprovado |
| `--negative` | `#c4242a` | Reprovado, erros |
| `--warning` | `#92400e` | Em análise |
| `--placa-azul` | `#1f4fa3` | Faixa da placa, só nela |

### Status do pedido

Cada status tem um selo com fundo claro e texto escuro do mesmo tom. Contraste do texto acima de 7:1.

| Status | Rótulo na tela | Fundo | Texto |
|---|---|---|---|
| `ENVIADO` | Aguardando análise | `#ebedee` | `#353736` |
| `EM_ANALISE` | Em análise | `#fffbeb` | `#92400e` |
| `APROVADO` | Aprovado | `#dcfae5` | `#04250e` |
| `REPROVADO` | Reprovado | `#ffedea` | `#831c1e` |
| `CONTRATADO` | Contratado | `#e3f1f4` | `#0e3d49` |
| `CANCELADO` | Cancelado | transparente, borda `#cdced1` | `#5d5f60` |

## Tipografia

- **Família:** IBM Plex Sans, pesos 400, 500 e 600, carregada pelo Google Fonts.
- **Segunda família:** IBM Plex Mono, só para placa, matrícula, CPF, RG e nº do pedido.
- **Tamanhos:** título da tela 22px; título de seção 16px; número de destaque 28px; texto 14px; legenda 12px.
- Números com `tabular-nums` em tabelas e valores; dinheiro em `R$ 4.250,00`, datas em `03/11/2026`.
- Sem caixa alta espaçada; tudo em caixa de frase.

## Componentes

Sem biblioteca de componentes: CSS puro com os tokens acima, em CSS Modules. Ícones do `lucide-react` (licença ISC), em 16px e na cor do texto. Diálogo com o elemento nativo `<dialog>`.

| Componente | Regra |
|---|---|
| Botão principal | Preenchido em `--accent`, texto branco, 32px de altura, raio 6px. Um por tela |
| Botão secundário | Fundo `--surface`, borda `--control` |
| Botão de perigo | Texto `--negative`, borda `--control`; preenchido só dentro do diálogo de confirmação |
| Campo | 40px, borda `--control`, raio 6px; rótulo 14/500 acima, 8px de distância; erro em `--negative` abaixo do campo |
| Tabela | Linhas de 48px separadas por `--rule`, sem zebra e sem faixa no cabeçalho; números alinhados à direita |
| Cartão de contagem | 61px, rótulo 13px cinza sobre valor 16/600; selecionado ganha borda de 1,5px e fundo claro em `--accent` |
| Placa | Retângulo branco com borda de 1px em `--text`, faixa `--placa-azul` no topo com "BRASIL", caracteres em Plex Mono 600. Dois tamanhos: 20px na tabela, 40px no detalhe |
| Caminho do pedido | Quatro marcos em linha; os concluídos em tinta, o atual em `--accent` com a data, os futuros em `--muted`. Reprovado e cancelado encerram o caminho no marco em que pararam |
| Foco | Contorno de 2px em `--accent`, afastado 2px, em todo elemento clicável |

## Telas

| Tela | Perfil | Pergunta que responde primeiro | Ação principal |
|---|---|---|---|
| Entrar | Todos | Como eu entro? | Entrar |
| Criar conta | Cliente | O que preciso informar? | Criar conta |
| Meus pedidos | Cliente | Em que pé estão meus pedidos? | Novo pedido |
| Novo pedido | Cliente | Qual carro e em que datas? | Enviar pedido |
| Detalhe do pedido | Cliente, agente | O que falta para este aluguel sair? | Depende do status e do perfil |
| Meus dados | Cliente | Meus dados estão certos? | Salvar |
| Fila de pedidos | Agente | Quem está esperando parecer? | Analisar o mais antigo |
| Análise do pedido | Agente | Este cliente pode pagar? | Registrar parecer |
| Executar contrato | Agente | Quem fica dono do carro? | Executar contrato |
| Automóveis | Agente | Quais carros estão disponíveis? | Cadastrar automóvel |

### Entrar e Criar conta

Fora da moldura: a folha branca centrada sobre `--ground`, com 400px de largura. Marca acima do formulário. O erro de login diz só "Usuário ou senha incorretos". Criar conta em três blocos: acesso, dados pessoais e endereço; rendimentos ficam para depois, em Meus dados.

### Meus pedidos e Fila de pedidos

Lista com cartões de contagem por status acima da tabela. Clicar num cartão filtra a lista; contagem zero aparece como "0". Colunas: nº do pedido, placa, carro, período, criado em e status. A fila do agente abre filtrada em "Aguardando análise", ordenada do mais antigo para o mais novo, e cada linha tem o botão "Analisar".

### Detalhe e Análise do pedido

Cabeçalho é o próprio pedido: placa grande, marca e modelo, período e o caminho do pedido. Abaixo, em grade de 6 colunas:

- **Cliente:** nome, CPF, profissão e endereço.
- **Rendimentos:** até 3 linhas, com empregador e valor, e a soma mensal.
- **Proporção:** valor do aluguel sobre a renda mensal, em número grande. É o dado que o agente procura primeiro. O cálculo e o valor da diária ficam definidos no plano.
- **Parecer:** formulário com favorável ou desfavorável, justificativa obrigatória e o botão "Registrar parecer". Depois de registrado, mostra agente, data e texto.

Para o cliente, as ações são "Modificar pedido" e "Cancelar pedido", que somem quando o status não permite. Modificar um pedido avaliado mostra um aviso antes: o parecer será descartado.

### Executar contrato

Diálogo a partir de um pedido aprovado. O agente escolhe o tipo de contrato em três opções grandes, cada uma dizendo quem fica proprietário do carro com o nome real: o cliente, a empresa ou o banco. A opção de banco só aparece para bancos e abre os campos do crédito: valor, taxa de juros e parcelas.

### Meus dados

Configurações em duas colunas: rótulo e descrição à esquerda, painel à direita. Seções: dados pessoais, endereço, rendimentos e excluir conta. Rendimentos mostra "2 de 3" e esconde o botão de adicionar no terceiro. Excluir conta fica por último e, com pedido ativo, aparece desativado com o motivo escrito.

### Automóveis

Tabela com placa, matrícula, marca, modelo, ano e proprietário. Cadastrar e editar em diálogo.

## Estados

| Estado | Como aparece |
|---|---|
| Carregando | Linhas da tabela em `--raised` no tamanho final, sem animação de brilho |
| Vazio | Frase do negócio e a ação: "Você ainda não fez nenhum pedido." com o botão "Novo pedido" |
| Erro da API | Faixa no topo da folha com a mensagem e "Tentar de novo" |
| Erro de campo | Texto em `--negative` abaixo do campo, ligado por `aria-describedby` |
| Sem permissão | Tela "Você não tem acesso a esta página" com link para o início |
| Sessão vencida | Volta para Entrar com o aviso "Sua sessão terminou. Entre de novo para continuar." e, depois do login, para a tela em que estava |
| Não encontrado | Página 404 com link para o início |
| Ação concluída | Aviso discreto no canto inferior por 4 segundos: "Pedido enviado" |

## Celular

A moldura some e a folha vira a tela inteira. Barra superior de 48px com botão de menu, título e uma ação; o menu abre como painel lateral. Os cartões de contagem viram uma fila de chips com rolagem horizontal. A tabela vira lista de cartões com placa, carro, período e status. Na grade do detalhe, cada bloco ocupa a largura toda, na mesma ordem.

## Acessibilidade

- Contraste mínimo de 4,5:1 em texto e 3:1 em bordas de campos e ícones.
- Status nunca só por cor: o selo sempre tem o rótulo escrito.
- Toda tela utilizável só pelo teclado, com foco visível.
- `prefers-reduced-motion` desliga as transições de menu e diálogo.

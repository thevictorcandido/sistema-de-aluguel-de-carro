# Verificação

Tarefa 12, em 2026-11-04. Cada item foi medido no sistema rodando, não lido no código. O resultado é **passou**, **falhou**, **não se aplica** ou **não verificado**, sempre com a evidência.

## Como foi medido

- **Ambiente:** API no perfil `local` (H2 com os dados iniciais), front pelo Vite e pelo build de produção (`vite preview`), em portas separadas das de desenvolvimento.
- **Testes automáticos:** `./mvnw verify` (130 testes), `npm test` (67 testes), `npx biome check` e `npm run e2e` (6 testes, Chrome e Firefox).
- **Segurança:** um roteiro em PowerShell chamou a API com cada perfil, sem cookie e com token forjado.
- **Visual:** um roteiro com Playwright entrou com cada perfil e mediu 12 telas em 3 larguras (1440, 900 e 390px). Foram medidos rolagem horizontal, alvos de toque, erros de console e contraste, com as mesmas regras da skill `auditoria-visual`. Celular e tablet simulam tela de toque.
- **Desempenho:** build de produção no celular (390px), CPU 4x mais lenta e rede 4G simulada (150 ms de latência, 1,6 Mbit/s).

## Revisão de código

A revisão achou 9 pontos. Sete foram corrigidos nesta tarefa; dois ficam registrados como limitação.

| # | Ponto | Resultado |
|---|---|---|
| 1 | Uma empresa podia ficar dona, pelo contrato, de um carro de outra empresa | Corrigido. Só a empresa dona do carro fica proprietária. Teste `empresaNaoTomaOCarroDeOutraEmpresa` |
| 2 | Duas requisições simultâneas que violavam uma constraint do banco respondiam 500 | Corrigido. Respondem 409 com a mensagem "Estes dados mudaram enquanto você salvava" |
| 3 | Resposta que não era JSON (502 do proxy) quebrava a mensagem de erro do front | Corrigido. `lerJson` trata o corpo inválido e a tela mostra "Não foi possível falar com o servidor" |
| 4 | Logout e exclusão de conta não invalidam um token já copiado | Limitação. A sessão é stateless: o cookie é apagado, mas um token copiado vale até expirar (8 horas). Uma lista de tokens revogados resolveria |
| 5 | Listas de pedidos e contratos faziam uma consulta por linha | Corrigido com `@EntityGraph` nos repositórios |
| 6 | O tempo de resposta do login revelava se o usuário existia | Corrigido. O BCrypt roda também para usuário inexistente. Medido: 78 ms com senha errada e 75 ms com usuário inexistente |
| 7 | O aviso de ação concluída voltava ao recarregar a página | Corrigido com `useAvisoDeNavegacao`, que limpa o estado do histórico |
| 8 | Cookie de sessão sem `Secure` também no perfil `supabase` | Limitação. Sem deploy com HTTPS, ligar a flag impediria o login local. Antes de publicar, `app.cookie.seguro=true` |
| 9 | A data mínima do pedido usava o fuso do navegador, e a API usa o de Brasília | Corrigido. `hojeIso` usa `America/Sao_Paulo` |

A verificação achou mais três defeitos, também corrigidos nesta tarefa:

- **Id inválido:** `GET /api/pedidos/abc` respondia no formato padrão do Spring. Agora responde 400 no formato da SPEC, com o teste `idQueNaoENumeroRespondeNoFormatoDeErro`.
- **Alvos de toque:** os alvos ficavam abaixo de 44px no celular (veja Experiência).
- **Deslocamento de layout:** a tela Novo pedido tinha CLS de 0,292 no celular (veja Desempenho).

## Segurança com backend

| Teste | Como foi feito | Resultado |
|---|---|---|
| Segredos no navegador | Busca por `JWT_SECRET`, `DB_PASSWORD`, `supabase.co`, `senha123`, `eyJhbGci` e pela chave local no `dist/` do build | **Passou.** Nada encontrado e sem sourcemaps no build |
| Segredos no git | `git log --all -p` filtrado por senha, segredo, chave e token | **Passou.** Só aparecem a chave de desenvolvimento do perfil `local`, que não protege nenhum dado real, e os campos vazios do `.env.example`. O `.env` está no `.gitignore` e nunca foi versionado |
| Arquivos expostos | `/.env`, `/backend/.env`, `/.git/config` e `/@fs/.../backend/.env` pelo Vite | **Passou.** Os quatro devolvem a página do app (fallback da SPA), sem o conteúdo do arquivo |
| Sessão | Sem cookie em `/clientes/me`, `/pedidos`, `/contratos` e `/automoveis`; depois com token de assinatura forjada | **Passou.** 401 em todos, e o front leva para Entrar (teste ponta a ponta "cada perfil só abre as próprias telas") |
| Cookie | Cabeçalho `Set-Cookie` do login | **Passou.** `HttpOnly`, `SameSite=Strict`, `Max-Age=28800`. Sem `Secure`: ver o ponto 8 da revisão |
| Autorização entre clientes | Marina criou o pedido 1; João pediu `GET`, `PUT` e `POST /cancelar` nesse pedido | **Passou.** 404 nas três chamadas, e o pedido não aparece na lista do João. A Marina abre o mesmo pedido com 200 |
| Cliente em rota de agente | Marina em `POST /pedidos/1/analise`, `GET /contratos` e `POST /automoveis` | **Passou.** 403 nas três |
| Agente em rota de cliente | Via Leste em `GET /clientes/me` e `DELETE` do carro da Rota Sul | **Passou.** 403 nas duas |
| Logout | Mesma sessão depois do `POST /auth/logout` | **Passou.** 204 no logout e 401 na chamada seguinte |
| Mensagens de erro | JSON quebrado, id inválido, senha errada e usuário inexistente | **Passou.** Nenhum detalhe interno, e login errado e usuário inexistente devolvem a mesma mensagem |
| Cabeçalhos de segurança da API | `GET /api/health` | **Passou em parte.** Tem `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` e `Cache-Control: no-store`. HSTS e CSP dependem do servidor que publicar o front com HTTPS, e não há deploy |
| CORS | Preflight de `https://site-de-fora.example` | **Passou.** 401 e nenhum `Access-Control-Allow-Origin`. Front e API usam a mesma origem pelo proxy |
| Limite de tentativas | — | **Falhou, fora do escopo.** Não há limitador; a SPEC, no ponto em aberto 1, deixa para quando houver deploy |
| Backup restaurado | — | **Não se aplica.** O projeto Supabase ainda não foi criado; as migrações V1 e V2 recriam o banco (ponto em aberto 2) |

## Medição visual

As 12 telas foram medidas com os perfis anônimo, cliente (marina) e empresa (rotasul), em 3 larguras: 36 combinações, com 0 falhas depois das correções.

| Medida | Mínimo | Resultado |
|---|---|---|
| Rolagem horizontal da página | Nenhuma em 1440, 900 e 390px | **Passou** nas 36 combinações. A tabela de Automóveis rola dentro do próprio bloco no celular, com a coluna de ações presa à direita, como decidido na tarefa 10 |
| Contraste de texto | 4,5:1 (3:1 em texto grande) | **Passou.** 370 pares medidos nas 12 telas, nenhum abaixo do mínimo |
| Alvos de toque | 44px em tela de toque, 24px com mouse | **Passou depois da correção.** Antes, campos tinham 40px, botões 32px, o menu 35px, o botão do menu 36px e os ícones de editar e excluir 32px. Agora, com `pointer: coarse`, os tokens `--control-height` e `--field-height` sobem para 44px. No computador o DESIGN.md continua igual |
| Erros de console | Nenhum | **Passou.** As telas sem login mostram só o 401 esperado da consulta de sessão |
| Movimento reduzido | Sem animação e sem conteúdo invisível | **Passou.** 0 animações ativas e 0 elementos em opacidade zero |
| Teclado e foco | Primeiro Tab no link de pular, foco visível | **Passou.** A sequência é Pular para o conteúdo > Meus pedidos > Novo pedido > Meus dados > Sair > ações da tela, todas com contorno de 2 a 3px |
| Título de cada tela | Único e descritivo | **Passou.** Por exemplo, "Análise do pedido #1 · Aluguel de Carros" |

## Checklist de site

O sistema é um painel interno com login, entregue como trabalho de disciplina e sem publicação. Os itens de site público (busca, prévia de link, dados de loja) não se aplicam, mas estão listados para mostrar a cobertura.

### Encontrável

| Item | Resultado |
|---|---|
| Meta title único em cada página | **Passou.** `useTituloPagina` em todas as telas, medido no navegador |
| Meta description | **Passou.** Adicionada ao `index.html` nesta tarefa |
| Imagem Open Graph | **Não se aplica.** Sistema com login, sem páginas para compartilhar |
| Favicon | **Passou.** `public/favicon.svg` |
| `robots.txt` e `sitemap.xml` | **Não se aplica.** Nenhuma página pública para indexar |
| Texto alt | **Passou.** Não há `<img>`; os ícones têm `aria-hidden` ao lado de texto |
| GEO | **Não se aplica** |

### Confiança

| Item | Resultado |
|---|---|
| Domínio próprio com HTTPS | **Não se aplica.** Sem deploy |
| Endereço de contato, política de privacidade e termos | **Não se aplica.** Trabalho acadêmico com dados fictícios. Antes de publicar com dados reais de CPF, RG e renda, seria preciso uma política de privacidade |
| Imagens reais e banner de cookies | **Não se aplica.** Não há imagens nem cookies além do de sessão, que é essencial |
| Nenhum padrão visual típico de IA | **Passou.** O DESIGN.md foi aprovado em 2026-11-03, com tokens próprios, placa Mercosul e sem gradientes ou cartões genéricos |

### Experiência

| Item | Resultado |
|---|---|
| Responsivo | **Passou.** Ver Medição visual |
| CTA no topo | **Passou.** "Novo pedido" no menu e no topo de Meus pedidos; "Cadastrar automóvel" e "Analisar o mais antigo" no topo das telas da empresa |
| CTA fixo no celular | **Não se aplica.** É um sistema com menu, não uma página de venda; a barra superior tem só o menu e Sair, e a ação de cada tela fica no topo dela |
| Página 404 personalizada | **Passou.** "Página não encontrada", com link para o início |
| Telas de carregamento | **Passou.** Esqueletos com `role="status"` nas listas |
| Erros de formulário claros | **Passou.** Mensagem abaixo do campo, ligada por `aria-describedby`, coberta nos testes do front e da API |
| Página de obrigado | **Passou.** Depois de enviar, o pedido abre com o aviso "Pedido enviado." |

### Desempenho e medição

| Item | Resultado |
|---|---|
| Página leve | **Passou.** 104 KB transferidos na primeira visita (JS com 98 KB em gzip, CSS com 5 KB) |
| LCP até 2,5 s | **Passou.** Entrar 1.156 ms, Meus pedidos 1.016 ms, Novo pedido 824 ms, Automóveis 1.108 ms |
| CLS até 0,1 | **Passou depois da correção.** Novo pedido tinha 0,292: no celular, o painel de período aparecia embaixo do esqueleto e era empurrado quando a lista chegava. Ele passou a aparecer com a lista, e o CLS ficou em 0,001. As outras telas ficaram entre 0 e 0,005 |
| INP até 200 ms | **Passou.** Entre 24 e 40 ms nos cliques medidos |
| Imagens WebP e vídeos WebM | **Não se aplica.** Não há imagens nem vídeos |
| Analytics | **Não se aplica.** Sem coleta |

### Legal e confiança

| Item | Resultado |
|---|---|
| Formulários só pedem o necessário | **Passou.** Os campos são os do enunciado (RG, CPF, nome, endereço, profissão e até 3 rendimentos) |
| Exclusão dos dados | **Passou.** Meus dados > Excluir conta, bloqueada só com pedido ativo ou contrato |
| Política de reembolso, dados do fornecedor, preço, pagamento e depoimentos | **Não se aplica.** Não há venda online |
| Direito de uso de fontes e materiais | **Passou.** IBM Plex sob licença SIL OFL e ícones Lucide sob licença ISC |
| Botões que dizem o que fazem | **Passou.** "Enviar pedido", "Executar contrato", "Cancelar pedido", sem "OK" ou "Confirmar" soltos |

### Além do checklist

| Item | Resultado |
|---|---|
| Teclado, foco visível e movimento reduzido | **Passou.** Ver Medição visual |
| Firefox | **Passou.** Os 6 testes ponta a ponta rodam no Chrome e no Firefox |
| Safari | **Não verificado.** O WebKit do Playwright não está instalado nesta máquina |
| Formulário testado até o fim | **Passou.** Os testes ponta a ponta vão do cadastro ao contrato visto pelo cliente. Proteção contra spam não se aplica: todo formulário além do cadastro exige login |
| Nenhuma chave no código | **Passou.** Ver Segurança |
| Cabeçalhos de segurança | **Passou em parte.** Ver Segurança |
| `www` e links quebrados | **Passou** nos links: o roteiro visual abriu todas as rotas do menu sem 404. Redirecionamento de `www` não se aplica sem domínio |
| Prévia no WhatsApp | **Não se aplica** |
| Projeto no git com remoto | **Passou.** `github.com/thevictorcandido/sistema-de-aluguel-de-carro`, uma issue e um PR por tarefa |
| Permissão validada na API e CORS restrito | **Passou.** Ver Segurança |

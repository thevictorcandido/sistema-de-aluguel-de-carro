import { expect, test } from '@playwright/test'
import {
  cadastrarPelaApi,
  criarPedido,
  daquiA,
  entrar,
  escolherCarro,
  novoCliente,
  sair,
} from './apoio.js'

// Fluxo do enunciado de ponta a ponta: cadastro, login, pedido, análise, aprovação e contrato.
test('cliente se cadastra, pede, a empresa aprova e contrata', async ({ page }) => {
  const cliente = novoCliente('fluxo')

  // US01: cadastro pela tela; a conta já entra e abre Meus pedidos
  await page.goto('/criar-conta')
  await page.getByLabel('Usuário').fill(cliente.login)
  await page.getByLabel('Senha').fill(cliente.senha)
  await page.getByLabel('Nome completo').fill(cliente.nome)
  await page.getByLabel('CPF').fill(cliente.cpf)
  await page.getByLabel('RG').fill(cliente.rg)
  await page.getByLabel('Profissão').fill('Enfermeira')
  await page.getByLabel('CEP').fill('30160011')
  await page.getByLabel('Rua').fill('Rua da Bahia')
  await page.getByLabel('Número').fill('1148')
  await page.getByLabel('Bairro').fill('Centro')
  await page.getByLabel('Cidade').fill('Belo Horizonte')
  await page.getByLabel('Estado').selectOption('MG')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByRole('heading', { name: 'Meus pedidos' })).toBeVisible()
  await expect(page.getByText('Você ainda não fez nenhum pedido.')).toBeVisible()

  // US04: rendimento usado na análise
  await page.getByRole('link', { name: 'Meus dados' }).click()
  await page.getByLabel('Empregador').fill('Hospital das Clínicas')
  await page.getByLabel('Valor mensal (R$)').fill('6.000,00')
  await page.getByRole('button', { name: 'Adicionar rendimento' }).click()
  await expect(page.getByText('1 de 3 rendimentos informados')).toBeVisible()

  // US05: pedido do Onix por 3 diárias de R$ 180,00
  const inicio = daquiA(10)
  const fim = daquiA(12)
  await page.goto('/pedidos/novo')
  await escolherCarro(page, /Chevrolet Onix/)
  await page.getByLabel('Início').fill(inicio)
  await page.getByLabel('Fim').fill(fim)
  await expect(page.getByText('3 diárias de R$ 180,00')).toBeVisible()
  await page.getByRole('button', { name: 'Enviar pedido' }).click()
  const titulo = page.getByRole('heading', { level: 1, name: /^Pedido #\d+$/ })
  await expect(titulo).toBeVisible()
  const numero = Number((await titulo.textContent()).replace(/\D/g, ''))
  await expect(page.getByText('Aguardando análise').first()).toBeVisible()
  await sair(page)

  // US10: a empresa abre a análise pela fila e dá parecer favorável
  await entrar(page, 'rotasul')
  await expect(page.getByRole('heading', { name: 'Fila de pedidos' })).toBeVisible()
  await page.getByRole('button', { name: `Analisar pedido ${numero}` }).click()
  await expect(
    page.getByRole('heading', { name: `Pedido #${numero} · ${cliente.nome}` }),
  ).toBeVisible()
  await expect(
    page.getByText('Aluguel de R$ 540,00 equivale a 9% da renda mensal informada.'),
  ).toBeVisible()
  await page.getByRole('radio', { name: /Favorável/ }).check()
  await page.getByLabel('Justificativa').fill('Renda suficiente para o período.')
  await page.getByRole('button', { name: 'Registrar parecer' }).click()
  await expect(page.getByText('Parecer registrado.')).toBeVisible()

  // US11: contrato com a empresa como proprietária
  await page.getByRole('button', { name: 'Executar contrato' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Executar contrato' })
  await dialogo.getByRole('radio', { name: /A empresa fica proprietária/ }).check()
  await dialogo.getByRole('button', { name: 'Executar contrato' }).click()
  await expect(page.getByText('Contrato executado.')).toBeVisible()
  const contrato = page.getByRole('region', { name: 'Contrato' })
  await expect(contrato.getByText('Propriedade da empresa')).toBeVisible()
  await sair(page)

  // US06: o cliente vê o pedido contratado e o contrato
  await entrar(page, cliente.login, cliente.senha)
  await page
    .getByRole('link', { name: `#${numero}` })
    .first()
    .click()
  await expect(page.getByRole('listitem').filter({ hasText: 'Contratado' })).toHaveAttribute(
    'aria-current',
    'step',
  )
  await expect(
    page.getByRole('region', { name: 'Contrato' }).getByText('Locadora Rota Sul').first(),
  ).toBeVisible()
})

test('pedido reprovado, modificado e depois cancelado', async ({ page }) => {
  const cliente = novoCliente('reprova')
  await cadastrarPelaApi(page.request, cliente)

  await entrar(page, cliente.login, cliente.senha)
  const numero = await criarPedido(page, {
    carro: /Hyundai HB20/,
    inicio: daquiA(20),
    fim: daquiA(21),
  })
  await sair(page)

  // O banco reprova
  await entrar(page, 'horizonte')
  await page.getByRole('button', { name: `Analisar pedido ${numero}` }).click()
  await page.getByRole('radio', { name: /Desfavorável/ }).check()
  await page.getByLabel('Justificativa').fill('Cliente sem rendimentos informados.')
  await page.getByRole('button', { name: 'Registrar parecer' }).click()
  await expect(page.getByText('Reprovado').first()).toBeVisible()
  await sair(page)

  // US07: o cliente vê o parecer, modifica e o pedido volta para a fila sem o parecer
  await entrar(page, cliente.login, cliente.senha)
  await page.goto(`/pedidos/${numero}`)
  await expect(page.getByText('Cliente sem rendimentos informados.')).toBeVisible()
  await page.getByRole('link', { name: 'Modificar pedido' }).click()
  await expect(page.getByText(/o parecer é descartado/)).toBeVisible()
  await escolherCarro(page, /Renault Kwid/)
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await page
    .getByRole('dialog', { name: 'Descartar o parecer?' })
    .getByRole('button', { name: 'Modificar mesmo assim' })
    .click()
  await expect(page.getByText('Pedido modificado.')).toBeVisible()
  await expect(page.getByText('Aguardando análise').first()).toBeVisible()
  await expect(page.getByText('Um agente ainda vai analisar este pedido.')).toBeVisible()

  // US08: cancela; o pedido fica no histórico e as ações somem
  await page.getByRole('button', { name: 'Cancelar pedido' }).click()
  await page
    .getByRole('dialog', { name: 'Cancelar este pedido?' })
    .getByRole('button', { name: 'Cancelar pedido' })
    .click()
  await expect(page.getByText('Pedido cancelado.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Modificar pedido' })).toHaveCount(0)
})

test('cada perfil só abre as próprias telas', async ({ page }) => {
  // Sem login, volta para Entrar
  await page.goto('/pedidos')
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()

  await entrar(page, 'marina')
  await page.goto('/fila')
  await expect(
    page.getByRole('heading', { name: 'Você não tem acesso a esta página' }),
  ).toBeVisible()
  await sair(page)

  await entrar(page, 'vialeste')
  await page.goto('/meus-dados')
  await expect(
    page.getByRole('heading', { name: 'Você não tem acesso a esta página' }),
  ).toBeVisible()

  // A API também recusa, mesmo contornando a tela (fetch da própria página, com o cookie da sessão)
  const status = await page.evaluate(() => fetch('/api/clientes/me').then((r) => r.status))
  expect(status).toBe(403)
})

import { expect } from '@playwright/test'

// Apoio dos testes ponta a ponta: dados fictícios únicos por teste e as ações repetidas entre eles.

/** CPF fictício com dígitos verificadores válidos, no formato 000.000.000-00. */
export function cpfAleatorio() {
  const d = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  for (const tamanho of [9, 10]) {
    const soma = d.slice(0, tamanho).reduce((acc, n, i) => acc + n * (tamanho + 1 - i), 0)
    const resto = (soma * 10) % 11
    d.push(resto === 10 ? 0 : resto)
  }
  const s = d.join('')
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`
}

/** Data de hoje mais `dias`, no fuso de Brasília, no formato do campo de data. */
export function daquiA(dias) {
  const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  hoje.setDate(hoje.getDate() + dias)
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${hoje.getFullYear()}-${mes}-${dia}`
}

/** Cliente novo e único, para os testes não dependerem uns dos outros. */
export function novoCliente(prefixo) {
  const sufixo = `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
  return {
    login: `${prefixo}${sufixo}`.slice(0, 40),
    senha: 'senha-e2e-123',
    nome: `Cliente ${prefixo} ${sufixo}`,
    cpf: cpfAleatorio(),
    rg: `MG-${sufixo}`.toUpperCase().slice(0, 20),
  }
}

/** Cadastra o cliente direto pela API, quando o teste não é sobre o cadastro. */
export async function cadastrarPelaApi(request, cliente) {
  const resposta = await request.post('/api/clientes', {
    data: {
      login: cliente.login,
      senha: cliente.senha,
      nome: cliente.nome,
      cpf: cliente.cpf,
      rg: cliente.rg,
      profissao: 'Analista',
      endereco: {
        logradouro: 'Rua dos Testes',
        numero: '10',
        complemento: '',
        bairro: 'Centro',
        cidade: 'Belo Horizonte',
        uf: 'MG',
        cep: '30100-000',
      },
    },
  })
  expect(resposta.status()).toBe(201)
}

export async function entrar(page, login, senha = 'senha123') {
  await page.goto('/entrar')
  await page.getByLabel('Usuário').fill(login)
  await page.getByLabel('Senha').fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
}

export async function sair(page) {
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
}

/** O rádio do carro fica invisível: a pessoa clica no cartão, e o teste faz o mesmo. */
export async function escolherCarro(page, nome) {
  await page.locator('label').filter({ hasText: nome }).click()
  await expect(page.getByRole('radio', { name: nome })).toBeChecked()
}

/** Cria um pedido pela tela Novo pedido e devolve o número dele. */
export async function criarPedido(page, { carro, inicio, fim }) {
  await page.goto('/pedidos/novo')
  await escolherCarro(page, carro)
  await page.getByLabel('Início').fill(inicio)
  await page.getByLabel('Fim').fill(fim)
  await page.getByRole('button', { name: 'Enviar pedido' }).click()
  const titulo = page.getByRole('heading', { level: 1, name: /^Pedido #\d+$/ })
  await expect(titulo).toBeVisible()
  return Number((await titulo.textContent()).replace(/\D/g, ''))
}

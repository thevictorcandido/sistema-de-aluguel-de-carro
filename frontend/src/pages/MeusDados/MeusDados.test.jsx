import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
// A Testing Library troca o espaço não separável de "R$ " por espaço comum ao ler a tela.
import { MARINA, simularApi } from '../../test/apiFalsa.js'
import { renderizarEm } from '../../test/renderizar.jsx'

function dadosDaMarina(sobrescrever = {}) {
  return {
    id: 5,
    login: 'marina',
    nome: 'Marina Costa',
    cpf: '123.456.789-09',
    rg: 'MG-12.345.678',
    profissao: 'Enfermeira',
    endereco: {
      logradouro: 'Rua da Bahia',
      numero: '1148',
      complemento: 'ap. 302',
      bairro: 'Centro',
      cidade: 'Belo Horizonte',
      uf: 'MG',
      cep: '30160-011',
    },
    rendimentos: [
      { id: 1, entidadeEmpregadora: 'Hospital São Lucas', valor: 4200 },
      { id: 2, entidadeEmpregadora: 'Clínica Vida Plena', valor: 1300 },
    ],
    rendaMensal: 5500,
    maximoRendimentos: 3,
    exclusao: { permitida: true, motivo: null },
    ...sobrescrever,
  }
}

describe('Meus dados', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('mostra o cadastro, os rendimentos em reais e quantos ainda cabem', async () => {
    simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/clientes/me': [200, dadosDaMarina()],
    })
    renderizarEm('/meus-dados')

    expect(await screen.findByLabelText('Nome completo')).toHaveValue('Marina Costa')
    expect(screen.getByLabelText('CEP')).toHaveValue('30160-011')
    expect(screen.getByLabelText('Estado')).toHaveValue('MG')
    expect(screen.getByText('R$ 4.200,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 5.500,00')).toBeInTheDocument()
    expect(screen.getByText('2 de 3 rendimentos informados')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar rendimento' })).toBeInTheDocument()
  })

  it('salva os dados pessoais e o endereço juntos e avisa', async () => {
    const chamadas = simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/clientes/me': [200, dadosDaMarina()],
      'PUT /api/clientes/me': [200, dadosDaMarina({ profissao: 'Enfermeira chefe' })],
    })
    renderizarEm('/meus-dados')
    const usuario = userEvent.setup()

    const profissao = await screen.findByLabelText('Profissão')
    await usuario.clear(profissao)
    await usuario.type(profissao, 'Enfermeira chefe')
    await usuario.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Dados salvos.')).toBeInTheDocument()
    const enviado = chamadas.find((c) => c.chave === 'PUT /api/clientes/me').corpo
    expect(enviado).toMatchObject({
      profissao: 'Enfermeira chefe',
      cpf: '123.456.789-09',
      endereco: { cep: '30160-011', complemento: 'ap. 302', uf: 'MG' },
    })
  })

  it('ao chegar ao terceiro rendimento, esconde o formulário de adicionar', async () => {
    let atual = dadosDaMarina()
    const chamadas = simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/clientes/me': () => [200, atual],
      'POST /api/clientes/me/rendimentos': () => {
        atual = dadosDaMarina({
          rendimentos: [
            ...atual.rendimentos,
            { id: 3, entidadeEmpregadora: 'Plantões extras', valor: 800.5 },
          ],
          rendaMensal: 6300.5,
        })
        return [201, { id: 3, entidadeEmpregadora: 'Plantões extras', valor: 800.5 }]
      },
    })
    renderizarEm('/meus-dados')
    const usuario = userEvent.setup()

    await usuario.type(await screen.findByLabelText('Empregador'), 'Plantões extras')
    await usuario.type(screen.getByLabelText('Valor mensal (R$)'), '800,50')
    await usuario.click(screen.getByRole('button', { name: 'Adicionar rendimento' }))

    expect(await screen.findByText('3 de 3 rendimentos informados')).toBeInTheDocument()
    expect(screen.getByText('R$ 6.300,50')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Adicionar rendimento' })).not.toBeInTheDocument()
    expect(chamadas.find((c) => c.chave === 'POST /api/clientes/me/rendimentos').corpo).toEqual({
      entidadeEmpregadora: 'Plantões extras',
      valor: 800.5,
    })
  })

  it('recusa valor que não é número antes de chamar a API', async () => {
    const chamadas = simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/clientes/me': [200, dadosDaMarina()],
    })
    renderizarEm('/meus-dados')
    const usuario = userEvent.setup()

    await usuario.type(await screen.findByLabelText('Empregador'), 'Freela')
    await usuario.type(screen.getByLabelText('Valor mensal (R$)'), 'mil reais')
    await usuario.click(screen.getByRole('button', { name: 'Adicionar rendimento' }))

    expect(await screen.findByText('Use só números, como 4.200,50.')).toBeInTheDocument()
    expect(chamadas.some((c) => c.chave.startsWith('POST'))).toBe(false)
  })

  it('com pedido em andamento, o botão de excluir fica desativado e diz por quê', async () => {
    const motivo = 'Você tem pedidos em andamento. Cancele-os antes de excluir a conta.'
    simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/clientes/me': [200, dadosDaMarina({ exclusao: { permitida: false, motivo } })],
    })
    renderizarEm('/meus-dados')

    const botao = await screen.findByRole('button', { name: 'Excluir conta' })
    expect(botao).toBeDisabled()
    expect(botao).toHaveAccessibleDescription(motivo)
  })

  it('exclui a conta depois de confirmar e volta para Entrar', async () => {
    const chamadas = simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/clientes/me': [200, dadosDaMarina()],
      'DELETE /api/clientes/me': [204],
      'POST /api/auth/logout': [204],
    })
    renderizarEm('/meus-dados')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Excluir conta' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Excluir sua conta?' })
    await usuario.click(within(dialogo).getByRole('button', { name: 'Excluir conta' }))

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(chamadas.some((c) => c.chave === 'DELETE /api/clientes/me')).toBe(true)
  })

  it('se a API falhar ao carregar, oferece tentar de novo', async () => {
    let falhar = true
    simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/clientes/me': () =>
        falhar ? [500, { mensagem: 'Erro inesperado.' }] : [200, dadosDaMarina()],
    })
    renderizarEm('/meus-dados')
    const usuario = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro inesperado.')
    falhar = false
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByLabelText('Nome completo')).toHaveValue('Marina Costa')
  })
})

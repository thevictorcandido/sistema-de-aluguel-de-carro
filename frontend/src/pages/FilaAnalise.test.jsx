import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ROTA_SUL, simularApi } from '../test/apiFalsa.js'
import { renderizarEm } from '../test/renderizar.jsx'
import { hojeIso } from '../utils/formatos.js'

const ONIX = {
  id: 1,
  placa: 'RTA2F41',
  matricula: '01234567801',
  marca: 'Chevrolet',
  modelo: 'Onix',
  ano: 2024,
  valorDiaria: 180,
}

function diasAtras(n) {
  const data = new Date(`${hojeIso()}T12:00:00`)
  data.setDate(data.getDate() - n)
  return `${hojeIso(data)}T09:00:00`
}

const FICHA = {
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
  rendaComprometida: 32.7,
  referencia: 30,
}

function pedido(id, status, sobrescrever = {}) {
  return {
    id,
    status,
    dataCriacao: diasAtras(3),
    dataInicio: '2099-11-10',
    dataFim: '2099-11-19',
    diarias: 10,
    valorTotal: 1800,
    automovel: ONIX,
    cliente: { id: 5, nome: 'Marina Costa' },
    parecer: null,
    ficha: FICHA,
    ...sobrescrever,
  }
}

describe('Fila de pedidos', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('abre filtrada em Aguardando análise e diz há quanto tempo o mais antigo espera', async () => {
    simularApi({
      'GET /api/auth/me': [200, ROTA_SUL],
      'GET /api/pedidos': [
        200,
        [
          pedido(3, 'ENVIADO'),
          pedido(4, 'ENVIADO', {
            dataCriacao: diasAtras(1),
            cliente: { id: 6, nome: 'João Ferreira' },
          }),
          pedido(5, 'APROVADO'),
        ],
      ],
    })
    renderizarEm('/fila')

    expect(
      await screen.findByText('2 pedidos aguardam parecer. O mais antigo espera há 3 dias.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aguardando análise 2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getAllByRole('link', { name: /^#\d+$/ }).map((l) => l.textContent)).toEqual([
      '#3',
      '#4',
    ])
  })

  it('Analisar abre a análise e leva para a tela do pedido', async () => {
    let atual = pedido(3, 'ENVIADO')
    const chamadas = simularApi({
      'GET /api/auth/me': [200, ROTA_SUL],
      'GET /api/pedidos': () => [200, [atual]],
      'POST /api/pedidos/3/analise': () => {
        atual = pedido(3, 'EM_ANALISE')
        return [200, atual]
      },
      'GET /api/pedidos/3': () => [200, atual],
    })
    renderizarEm('/fila')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Analisar o mais antigo' }))

    expect(
      await screen.findByRole('heading', { name: 'Pedido #3 · Marina Costa' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Aluguel de R$ 1.800,00 equivale a 32,7% da renda mensal informada.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Referência 30%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar parecer' })).toBeInTheDocument()
    expect(chamadas.some((c) => c.chave === 'POST /api/pedidos/3/analise')).toBe(true)
  })
})

describe('Análise do pedido', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('registra o parecer favorável e mostra o resultado', async () => {
    const chamadas = simularApi({
      'GET /api/auth/me': [200, ROTA_SUL],
      'GET /api/pedidos/3': [200, pedido(3, 'EM_ANALISE')],
      'POST /api/pedidos/3/parecer': [
        200,
        pedido(3, 'APROVADO', {
          parecer: {
            positivo: true,
            justificativa: 'Renda estável em dois vínculos.',
            data: '2026-11-04T10:00:00',
            agente: 'Locadora Rota Sul',
          },
        }),
      ],
    })
    renderizarEm('/fila/3')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('radio', { name: /Favorável/ }))
    await usuario.type(screen.getByLabelText('Justificativa'), 'Renda estável em dois vínculos.')
    await usuario.click(screen.getByRole('button', { name: 'Registrar parecer' }))

    expect(await screen.findByText('Parecer registrado.')).toBeInTheDocument()
    const parecer = screen.getByRole('region', { name: 'Parecer' })
    expect(within(parecer).getByText('Favorável')).toBeInTheDocument()
    expect(
      within(parecer).queryByRole('button', { name: 'Registrar parecer' }),
    ).not.toBeInTheDocument()
    expect(chamadas.find((c) => c.chave === 'POST /api/pedidos/3/parecer').corpo).toEqual({
      positivo: true,
      justificativa: 'Renda estável em dois vínculos.',
    })
  })

  it('mostra no campo os erros do parecer', async () => {
    simularApi({
      'GET /api/auth/me': [200, ROTA_SUL],
      'GET /api/pedidos/3': [200, pedido(3, 'EM_ANALISE')],
      'POST /api/pedidos/3/parecer': [
        400,
        {
          mensagem: 'Confira os campos destacados.',
          campos: {
            positivo: 'Escolha favorável ou desfavorável.',
            justificativa: 'Escreva a justificativa.',
          },
        },
      ],
    })
    renderizarEm('/fila/3')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Registrar parecer' }))

    expect(await screen.findByRole('group', { name: 'Resultado' })).toHaveAccessibleDescription(
      'Escolha favorável ou desfavorável.',
    )
    expect(screen.getByLabelText('Justificativa')).toHaveAccessibleDescription(
      'Escreva a justificativa.',
    )
  })

  it('pedido ainda na fila mostra o botão de iniciar a análise', async () => {
    simularApi({
      'GET /api/auth/me': [200, ROTA_SUL],
      'GET /api/pedidos/3': [200, pedido(3, 'ENVIADO')],
      'POST /api/pedidos/3/analise': [200, pedido(3, 'EM_ANALISE')],
    })
    renderizarEm('/fila/3')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Iniciar análise' }))

    expect(await screen.findByRole('button', { name: 'Registrar parecer' })).toBeInTheDocument()
  })
})

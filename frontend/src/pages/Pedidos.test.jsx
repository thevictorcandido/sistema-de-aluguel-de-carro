import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MARINA, simularApi } from '../test/apiFalsa.js'
import { renderizarEm } from '../test/renderizar.jsx'

const ONIX = {
  id: 1,
  placa: 'RTA2F41',
  matricula: '01234567801',
  marca: 'Chevrolet',
  modelo: 'Onix',
  ano: 2024,
  valorDiaria: 180,
}
const HB20 = {
  ...ONIX,
  id: 2,
  placa: 'QPE7C02',
  marca: 'Hyundai',
  modelo: 'HB20',
  valorDiaria: 160,
}

function pedido(id, status, sobrescrever = {}) {
  return {
    id,
    status,
    dataCriacao: '2026-10-31T09:00:00',
    dataInicio: '2026-11-10',
    dataFim: '2026-11-19',
    diarias: 10,
    valorTotal: 1800,
    automovel: ONIX,
    cliente: { id: 5, nome: 'Marina Costa' },
    parecer: null,
    ...sobrescrever,
  }
}

describe('Meus pedidos', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('resume a situação, conta por status e filtra ao clicar', async () => {
    simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/pedidos': [
        200,
        [pedido(12, 'ENVIADO'), pedido(9, 'APROVADO', { automovel: HB20 }), pedido(7, 'CANCELADO')],
      ],
    })
    renderizarEm('/pedidos')
    const usuario = userEvent.setup()

    expect(await screen.findByText('3 pedidos, 1 aguarda análise ou parecer.')).toBeInTheDocument()
    const filtros = screen.getByRole('group', { name: 'Filtrar por status' })
    expect(within(filtros).getByRole('button', { name: 'Aprovados 1' })).toBeInTheDocument()
    expect(within(filtros).getByRole('button', { name: 'Contratados 0' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^#\d+$/ })).toHaveLength(3)

    await usuario.click(within(filtros).getByRole('button', { name: 'Aprovados 1' }))
    expect(screen.getAllByRole('link', { name: /^#\d+$/ }).map((l) => l.textContent)).toEqual([
      '#9',
    ])

    await usuario.click(within(filtros).getByRole('button', { name: 'Aprovados 1' }))
    expect(screen.getAllByRole('link', { name: /^#\d+$/ })).toHaveLength(3)
  })

  it('sem pedidos, diz isso e mantém o caminho para o primeiro', async () => {
    simularApi({ 'GET /api/auth/me': [200, MARINA], 'GET /api/pedidos': [200, []] })
    renderizarEm('/pedidos')

    expect(await screen.findByText('Você ainda não fez nenhum pedido.')).toBeInTheDocument()
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Novo pedido' }),
    ).toHaveAttribute('href', '/pedidos/novo')
  })
})

describe('Novo pedido', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('calcula o valor, envia e abre o detalhe com o aviso', async () => {
    const chamadas = simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/automoveis': [200, [ONIX, HB20]],
      'POST /api/pedidos': [201, pedido(15, 'ENVIADO')],
      'GET /api/pedidos/15': [200, pedido(15, 'ENVIADO')],
    })
    renderizarEm('/pedidos/novo')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('radio', { name: /Chevrolet Onix 2024/ }))
    fireEvent.change(screen.getByLabelText('Início'), { target: { value: '2099-11-10' } })
    fireEvent.change(screen.getByLabelText('Fim'), { target: { value: '2099-11-19' } })

    expect(screen.getByText('10 diárias de R$ 180,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.800,00')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Enviar pedido' }))

    expect(await screen.findByRole('heading', { name: 'Pedido #15' })).toBeInTheDocument()
    expect(screen.getByText('Pedido enviado.')).toBeInTheDocument()
    expect(await screen.findByRole('listitem', { current: 'step' })).toHaveTextContent('Enviado')
    expect(chamadas.find((c) => c.chave === 'POST /api/pedidos').corpo).toEqual({
      automovelId: 1,
      dataInicio: '2099-11-10',
      dataFim: '2099-11-19',
    })
  })

  it('mostra no campo os erros que a API devolve', async () => {
    simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/automoveis': [200, [ONIX]],
      'POST /api/pedidos': [
        400,
        {
          mensagem: 'Confira os campos destacados.',
          campos: {
            automovelId: 'Escolha um automóvel.',
            dataInicio: 'Informe a data de início.',
          },
        },
      ],
    })
    renderizarEm('/pedidos/novo')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Enviar pedido' }))

    expect(await screen.findByRole('group', { name: 'Automóvel' })).toHaveAccessibleDescription(
      'Escolha um automóvel.',
    )
    expect(screen.getByLabelText('Início')).toHaveAccessibleDescription('Informe a data de início.')
  })
})

describe('Detalhe do pedido', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('mostra o parecer quando existe', async () => {
    simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/pedidos/9': [
        200,
        pedido(9, 'REPROVADO', {
          parecer: {
            positivo: false,
            justificativa: 'Renda insuficiente para o período.',
            data: '2026-11-03T10:00:00',
            agente: 'Banco Horizonte',
          },
        }),
      ],
    })
    renderizarEm('/pedidos/9')

    expect(await screen.findByText('Renda insuficiente para o período.')).toBeInTheDocument()
    expect(screen.getByText('Desfavorável')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Placa R T A 2 F 4 1' })).toBeInTheDocument()
  })

  it('pedido de outra pessoa aparece como não encontrado', async () => {
    simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/pedidos/99': [404, { mensagem: 'Pedido não encontrado.' }],
    })
    renderizarEm('/pedidos/99')

    expect(
      await screen.findByRole('heading', { name: 'Pedido não encontrado' }),
    ).toBeInTheDocument()
  })
})

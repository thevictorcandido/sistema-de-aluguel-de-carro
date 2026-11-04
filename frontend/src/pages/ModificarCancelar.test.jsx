import { screen, within } from '@testing-library/react'
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

function pedido(status, sobrescrever = {}) {
  return {
    id: 9,
    status,
    dataCriacao: '2026-10-31T09:00:00',
    dataInicio: '2099-11-10',
    dataFim: '2099-11-12',
    diarias: 3,
    valorTotal: 540,
    automovel: ONIX,
    cliente: { id: 5, nome: 'Marina Costa' },
    parecer: null,
    ...sobrescrever,
  }
}

const PARECER = {
  positivo: true,
  justificativa: 'Renda compatível.',
  data: '2026-11-03T10:00:00',
  agente: 'Banco Horizonte',
}

describe('Modificar e cancelar', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('contratado não mostra as ações de modificar e cancelar', async () => {
    simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/pedidos/9': [200, pedido('CONTRATADO', { parecer: PARECER })],
    })
    renderizarEm('/pedidos/9')

    expect(await screen.findByText('Renda compatível.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Modificar pedido' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument()
  })

  it('cancela depois de confirmar e mostra o novo status', async () => {
    const chamadas = simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/pedidos/9': [200, pedido('ENVIADO')],
      'POST /api/pedidos/9/cancelar': [200, pedido('CANCELADO')],
    })
    renderizarEm('/pedidos/9')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Cancelar pedido' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Cancelar este pedido?' })
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar pedido' }))

    expect(await screen.findByText('Pedido cancelado.')).toBeInTheDocument()
    expect(screen.getAllByText('Cancelado').length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: 'Modificar pedido' })).not.toBeInTheDocument()
    expect(chamadas.some((c) => c.chave === 'POST /api/pedidos/9/cancelar')).toBe(true)
  })

  it('modificar abre o formulário preenchido e salva a troca de automóvel', async () => {
    const chamadas = simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/automoveis': [200, [ONIX, HB20]],
      'GET /api/pedidos/9': [200, pedido('ENVIADO')],
      'PUT /api/pedidos/9': [200, pedido('ENVIADO', { automovel: HB20, valorTotal: 480 })],
    })
    renderizarEm('/pedidos/9/modificar')
    const usuario = userEvent.setup()

    expect(await screen.findByRole('heading', { name: 'Modificar pedido #9' })).toBeInTheDocument()
    expect(await screen.findByRole('radio', { name: /Chevrolet Onix/ })).toBeChecked()
    expect(screen.getByLabelText('Início')).toHaveValue('2099-11-10')

    await usuario.click(screen.getByRole('radio', { name: /Hyundai HB20/ }))
    expect(screen.getByText('R$ 480,00')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Pedido modificado.')).toBeInTheDocument()
    expect(chamadas.find((c) => c.chave === 'PUT /api/pedidos/9').corpo).toEqual({
      automovelId: 2,
      dataInicio: '2099-11-10',
      dataFim: '2099-11-12',
    })
  })

  it('pedido aprovado avisa e pede confirmação antes de descartar o parecer', async () => {
    const chamadas = simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/automoveis': [200, [ONIX, HB20]],
      'GET /api/pedidos/9': [200, pedido('APROVADO', { parecer: PARECER })],
      'PUT /api/pedidos/9': [200, pedido('ENVIADO')],
    })
    renderizarEm('/pedidos/9/modificar')
    const usuario = userEvent.setup()

    expect(await screen.findByText(/o parecer é descartado/)).toBeInTheDocument()
    await usuario.click(await screen.findByRole('button', { name: 'Salvar alterações' }))

    const dialogo = await screen.findByRole('dialog', { name: 'Descartar o parecer?' })
    expect(chamadas.some((c) => c.chave === 'PUT /api/pedidos/9')).toBe(false)

    await usuario.click(within(dialogo).getByRole('button', { name: 'Modificar mesmo assim' }))
    expect(await screen.findByText('Pedido modificado.')).toBeInTheDocument()
    expect(chamadas.some((c) => c.chave === 'PUT /api/pedidos/9')).toBe(true)
  })
})

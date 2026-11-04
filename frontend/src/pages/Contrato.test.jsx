import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MARINA, ROTA_SUL, simularApi } from '../test/apiFalsa.js'
import { renderizarEm } from '../test/renderizar.jsx'

const HORIZONTE = { id: 3, login: 'horizonte', nome: 'Banco Horizonte', perfil: 'BANCO' }

const ONIX = {
  id: 1,
  placa: 'RTA2F41',
  matricula: '01234567801',
  marca: 'Chevrolet',
  modelo: 'Onix',
  ano: 2024,
  valorDiaria: 180,
  proprietarioId: ROTA_SUL.id,
  proprietario: 'Locadora Rota Sul',
}

const PARECER = {
  positivo: true,
  justificativa: 'Renda compatível.',
  data: '2026-11-03T10:00:00',
  agente: 'Locadora Rota Sul',
}

const FICHA = {
  cpf: '123.456.789-09',
  rg: 'MG-12.345.678',
  profissao: 'Enfermeira',
  endereco: {
    logradouro: 'Rua da Bahia',
    numero: '1148',
    complemento: null,
    bairro: 'Centro',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    cep: '30160-011',
  },
  rendimentos: [],
  rendaMensal: 5500,
  rendaComprometida: 32.7,
  referencia: 30,
}

const CONTRATO = {
  id: 1,
  tipo: 'PROPRIEDADE_BANCO',
  dataAssinatura: '2026-11-04',
  pedidoId: 3,
  placa: 'RTA2F41',
  automovel: 'Chevrolet Onix 2024',
  cliente: 'Marina Costa',
  executadoPor: 'Banco Horizonte',
  proprietario: 'Banco Horizonte',
  valorAluguel: 1800,
  credito: { valor: 1800, taxaJuros: 1.2, parcelas: 6, banco: 'Banco Horizonte' },
}

function pedido(status, sobrescrever = {}) {
  return {
    id: 3,
    status,
    dataCriacao: '2026-10-31T09:00:00',
    dataInicio: '2099-11-10',
    dataFim: '2099-11-19',
    diarias: 10,
    valorTotal: 1800,
    automovel: ONIX,
    cliente: { id: 5, nome: 'Marina Costa' },
    parecer: PARECER,
    ficha: FICHA,
    contrato: null,
    ...sobrescrever,
  }
}

describe('Executar contrato', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('empresa que não é dona do carro não vê a opção de ficar com ele', async () => {
    simularApi({
      'GET /api/auth/me': [
        200,
        { ...ROTA_SUL, id: 2, login: 'vialeste', nome: 'Locadora Via Leste' },
      ],
      'GET /api/pedidos/3': [200, pedido('APROVADO')],
    })
    renderizarEm('/fila/3')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Executar contrato' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Executar contrato' })
    expect(within(dialogo).getByText('O cliente fica proprietário')).toBeInTheDocument()
    expect(within(dialogo).queryByText('A empresa fica proprietária')).not.toBeInTheDocument()
  })

  it('a empresa vê as opções de cliente e empresa, com os nomes reais, e sem crédito', async () => {
    simularApi({
      'GET /api/auth/me': [200, ROTA_SUL],
      'GET /api/pedidos/3': [200, pedido('APROVADO')],
    })
    renderizarEm('/fila/3')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Executar contrato' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Executar contrato' })

    expect(
      within(dialogo).getByText('Marina Costa passa a ser dono do automóvel.'),
    ).toBeInTheDocument()
    expect(
      within(dialogo).getByText('Locadora Rota Sul continua dona do automóvel.'),
    ).toBeInTheDocument()
    expect(within(dialogo).queryByText('O banco fica proprietário')).not.toBeInTheDocument()
    expect(within(dialogo).queryByLabelText(/crédito/)).not.toBeInTheDocument()
  })

  it('o banco executa com crédito e o contrato aparece no pedido', async () => {
    let atual = pedido('APROVADO')
    const chamadas = simularApi({
      'GET /api/auth/me': [200, HORIZONTE],
      'GET /api/pedidos/3': () => [200, atual],
      'POST /api/pedidos/3/contrato': () => {
        atual = pedido('CONTRATADO', { contrato: CONTRATO })
        return [201, CONTRATO]
      },
    })
    renderizarEm('/fila/3')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Executar contrato' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Executar contrato' })
    await usuario.click(within(dialogo).getByRole('radio', { name: /O banco fica proprietário/ }))

    expect(within(dialogo).getByLabelText('Valor (R$)')).toHaveValue('1800,00')
    await usuario.type(within(dialogo).getByLabelText('Juros ao mês (%)'), '1,20')
    await usuario.type(within(dialogo).getByLabelText('Parcelas'), '6')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Executar contrato' }))

    expect(await screen.findByText('Contrato executado.')).toBeInTheDocument()
    const contrato = screen.getByRole('region', { name: 'Contrato' })
    expect(within(contrato).getByText('Propriedade do banco')).toBeInTheDocument()
    expect(within(contrato).getByText(/em 6x, 1,2% ao mês/)).toBeInTheDocument()
    expect(chamadas.find((c) => c.chave === 'POST /api/pedidos/3/contrato').corpo).toEqual({
      tipo: 'PROPRIEDADE_BANCO',
      credito: { valor: 1800, taxaJuros: 1.2, parcelas: 6 },
    })
  })

  it('o cliente vê o contrato no detalhe do próprio pedido', async () => {
    simularApi({
      'GET /api/auth/me': [200, MARINA],
      'GET /api/pedidos/3': [200, { ...pedido('CONTRATADO', { contrato: CONTRATO }), ficha: null }],
    })
    renderizarEm('/pedidos/3')

    const contrato = await screen.findByRole('region', { name: 'Contrato' })
    expect(within(contrato).getAllByText('Banco Horizonte', { selector: 'dd' })).toHaveLength(2)
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent(
      'Contratado04/11/2026',
    )
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument()
  })
})

describe('Contratos', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('lista os contratos e resume quantos têm crédito', async () => {
    simularApi({
      'GET /api/auth/me': [200, HORIZONTE],
      'GET /api/contratos': [
        200,
        [CONTRATO, { ...CONTRATO, id: 2, pedidoId: 4, tipo: 'PROPRIEDADE_CLIENTE', credito: null }],
      ],
    })
    renderizarEm('/contratos')

    expect(await screen.findByRole('heading', { name: 'Contratos e créditos' })).toBeInTheDocument()
    expect(await screen.findByText('2 contratos, 1 com crédito bancário.')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.800,00 em 6x')).toBeInTheDocument()
    expect(screen.getAllByTitle('Propriedade do cliente')).toHaveLength(1)
  })
})

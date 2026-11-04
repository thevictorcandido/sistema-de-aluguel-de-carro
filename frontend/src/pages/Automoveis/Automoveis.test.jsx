import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ROTA_SUL, simularApi } from '../../test/apiFalsa.js'
import { renderizarEm } from '../../test/renderizar.jsx'

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
const TCROSS = {
  ...ONIX,
  id: 5,
  placa: 'PXA1E87',
  matricula: '01234567805',
  marca: 'Volkswagen',
  modelo: 'T-Cross',
  proprietarioId: 2,
  proprietario: 'Locadora Via Leste',
}

describe('Automóveis', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('lista todos e só deixa editar e excluir os do próprio agente', async () => {
    simularApi({
      'GET /api/auth/me': [200, ROTA_SUL],
      'GET /api/automoveis': [200, [ONIX, TCROSS]],
    })
    renderizarEm('/automoveis')

    expect(
      await screen.findByText('2 automóveis, 1 em nome de Locadora Rota Sul.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar RTA2F41' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar PXA1E87' })).not.toBeInTheDocument()
    expect(screen.getByText('Locadora Via Leste')).toBeInTheDocument()
  })

  it('cadastra pelo diálogo, com a placa em maiúsculas e a diária em reais', async () => {
    let lista = [ONIX]
    const novo = {
      ...ONIX,
      id: 9,
      placa: 'RTZ9A12',
      matricula: '01234567899',
      marca: 'Nissan',
      modelo: 'Kicks',
      ano: 2025,
      valorDiaria: 230,
    }
    const chamadas = simularApi({
      'GET /api/auth/me': [200, ROTA_SUL],
      'GET /api/automoveis': () => [200, lista],
      'POST /api/automoveis': () => {
        lista = [...lista, novo]
        return [201, novo]
      },
    })
    renderizarEm('/automoveis')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Cadastrar automóvel' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Cadastrar automóvel' })
    await usuario.type(within(dialogo).getByLabelText('Placa'), 'rtz9a12')
    await usuario.type(within(dialogo).getByLabelText('Matrícula'), '01234567899')
    await usuario.type(within(dialogo).getByLabelText('Marca'), 'Nissan')
    await usuario.type(within(dialogo).getByLabelText('Modelo'), 'Kicks')
    await usuario.type(within(dialogo).getByLabelText('Ano'), '2025')
    await usuario.type(within(dialogo).getByLabelText('Diária (R$)'), '230,00')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cadastrar automóvel' }))

    expect(await screen.findByText('Automóvel RTZ9A12 cadastrado.')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: 'Placa R T Z 9 A 1 2' })).toBeInTheDocument()
    expect(chamadas.find((c) => c.chave === 'POST /api/automoveis').corpo).toEqual({
      placa: 'RTZ9A12',
      matricula: '01234567899',
      marca: 'Nissan',
      modelo: 'Kicks',
      ano: 2025,
      valorDiaria: 230,
    })
  })

  it('placa repetida volta com o erro no campo', async () => {
    simularApi({
      'GET /api/auth/me': [200, ROTA_SUL],
      'GET /api/automoveis': [200, [ONIX]],
      'PUT /api/automoveis/1': [
        409,
        {
          mensagem: 'Confira os campos destacados.',
          campos: { placa: 'Já existe um automóvel com esta placa.' },
        },
      ],
    })
    renderizarEm('/automoveis')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Editar RTA2F41' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Editar RTA2F41' })
    expect(within(dialogo).getByLabelText('Diária (R$)')).toHaveValue('180,00')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Salvar automóvel' }))

    expect(await within(dialogo).findByLabelText('Placa')).toHaveAccessibleDescription(
      'Já existe um automóvel com esta placa.',
    )
  })

  it('exclusão recusada pela API mostra o motivo no diálogo', async () => {
    simularApi({
      'GET /api/auth/me': [200, ROTA_SUL],
      'GET /api/automoveis': [200, [ONIX]],
      'DELETE /api/automoveis/1': [
        409,
        { mensagem: 'Este automóvel já aparece em pedidos e não pode ser excluído.' },
      ],
    })
    renderizarEm('/automoveis')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Excluir RTA2F41' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Excluir RTA2F41?' })
    await usuario.click(within(dialogo).getByRole('button', { name: 'Excluir' }))

    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
      'Este automóvel já aparece em pedidos e não pode ser excluído.',
    )
  })
})

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { simularApi } from '../../test/apiFalsa.js'
import { renderizarEm } from '../../test/renderizar.jsx'

const ANA = { id: 7, login: 'ana', nome: 'Ana Ribeiro', perfil: 'CLIENTE' }

async function preencher(usuario) {
  await usuario.type(await screen.findByLabelText('Usuário'), 'ana')
  await usuario.type(screen.getByLabelText('Senha'), 'senha-forte-1')
  await usuario.type(screen.getByLabelText('Nome completo'), 'Ana Ribeiro')
  await usuario.type(screen.getByLabelText('CPF'), '11144477735')
  await usuario.type(screen.getByLabelText('RG'), 'MG-55.666.777')
  await usuario.type(screen.getByLabelText('Profissão'), 'Professora')
  await usuario.type(screen.getByLabelText('CEP'), '30180100')
  await usuario.type(screen.getByLabelText('Rua'), 'Rua Guajajaras')
  await usuario.type(screen.getByLabelText('Número'), '40')
  await usuario.type(screen.getByLabelText('Bairro'), 'Centro')
  await usuario.type(screen.getByLabelText('Cidade'), 'Belo Horizonte')
  await usuario.selectOptions(screen.getByLabelText('Estado'), 'MG')
}

describe('Criar conta', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('envia o cadastro com CPF e CEP formatados, entra e abre Meus pedidos', async () => {
    const chamadas = simularApi({
      'GET /api/auth/me': [401],
      'POST /api/clientes': [201, ANA],
      'POST /api/auth/login': [200, ANA],
    })
    renderizarEm('/criar-conta')
    const usuario = userEvent.setup()

    await preencher(usuario)
    expect(screen.getByLabelText('CPF')).toHaveValue('111.444.777-35')
    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('heading', { name: 'Meus pedidos' })).toBeInTheDocument()
    const cadastro = chamadas.find((c) => c.chave === 'POST /api/clientes').corpo
    expect(cadastro).toMatchObject({
      login: 'ana',
      cpf: '111.444.777-35',
      endereco: { cep: '30180-100', uf: 'MG', complemento: '' },
    })
    expect(chamadas.find((c) => c.chave === 'POST /api/auth/login').corpo).toEqual({
      login: 'ana',
      senha: 'senha-forte-1',
    })
  })

  it('mostra os erros da API no campo certo, inclusive os do endereço', async () => {
    simularApi({
      'GET /api/auth/me': [401],
      'POST /api/clientes': [
        409,
        {
          mensagem: 'Confira os campos destacados.',
          campos: {
            cpf: 'Já existe uma conta com este CPF.',
            'endereco.cep': 'Use o formato 00000-000.',
          },
        },
      ],
    })
    renderizarEm('/criar-conta')
    const usuario = userEvent.setup()

    await preencher(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Já existe uma conta com este CPF.')).toBeInTheDocument()
    expect(screen.getByLabelText('CPF')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('CEP')).toHaveAccessibleDescription('Use o formato 00000-000.')
    expect(screen.getByRole('alert')).toHaveTextContent('Confira os campos destacados.')
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeEnabled()
  })
})

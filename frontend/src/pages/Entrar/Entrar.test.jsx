import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MARINA, simularApi } from '../../test/apiFalsa.js'
import { renderizarEm } from '../../test/renderizar.jsx'

describe('Entrar', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('com a senha errada, mostra a mensagem da API sem dizer qual campo errou', async () => {
    simularApi({
      'GET /api/auth/me': [401],
      'POST /api/auth/login': [401, { mensagem: 'Usuário ou senha incorretos.', campos: {} }],
    })
    renderizarEm('/entrar')
    const usuario = userEvent.setup()

    await usuario.type(await screen.findByLabelText('Usuário'), 'marina')
    await usuario.type(screen.getByLabelText('Senha'), 'errada')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha incorretos.')
    expect(screen.getByLabelText('Usuário')).not.toHaveAttribute('aria-invalid')
  })

  it('campos vazios mostram o erro em cada campo', async () => {
    simularApi({
      'GET /api/auth/me': [401],
      'POST /api/auth/login': [
        400,
        {
          mensagem: 'Confira os campos destacados.',
          campos: { login: 'Informe o usuário.', senha: 'Informe a senha.' },
        },
      ],
    })
    renderizarEm('/entrar')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe o usuário.')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuário')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription('Informe a senha.')
  })

  it('com a senha certa, entra e vai para a tela inicial do perfil', async () => {
    const chamadas = simularApi({
      'GET /api/auth/me': [401],
      'POST /api/auth/login': [200, MARINA],
    })
    renderizarEm('/entrar')
    const usuario = userEvent.setup()

    await usuario.type(await screen.findByLabelText('Usuário'), 'marina')
    await usuario.type(screen.getByLabelText('Senha'), 'senha123')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Meus pedidos' })).toBeInTheDocument()
    expect(screen.getByText('Marina Costa')).toBeInTheDocument()
    expect(chamadas.find((c) => c.chave === 'POST /api/auth/login').corpo).toEqual({
      login: 'marina',
      senha: 'senha123',
    })
  })

  it('volta para a tela que a pessoa tentou abrir antes do login', async () => {
    simularApi({ 'GET /api/auth/me': [401], 'POST /api/auth/login': [200, MARINA] })
    renderizarEm('/meus-dados')
    const usuario = userEvent.setup()

    await usuario.type(await screen.findByLabelText('Usuário'), 'marina')
    await usuario.type(screen.getByLabelText('Senha'), 'senha123')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Meus dados' })).toBeInTheDocument()
  })

  it('Sair apaga a sessão e volta para Entrar', async () => {
    simularApi({ 'GET /api/auth/me': [200, MARINA], 'POST /api/auth/logout': [204] })
    renderizarEm('/pedidos')
    const usuario = userEvent.setup()

    await usuario.click(await screen.findByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })
})

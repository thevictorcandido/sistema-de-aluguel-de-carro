import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MARINA, ROTA_SUL, simularApi } from '../test/apiFalsa.js'
import { renderizarEm } from '../test/renderizar.jsx'

describe('rotas protegidas', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sem login, manda para Entrar', async () => {
    simularApi({ 'GET /api/auth/me': [401] })
    renderizarEm('/pedidos')
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('a raiz leva o cliente para Meus pedidos', async () => {
    simularApi({ 'GET /api/auth/me': [200, MARINA] })
    renderizarEm('/')
    expect(await screen.findByRole('heading', { name: 'Meus pedidos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Meus pedidos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.queryByRole('link', { name: 'Fila de pedidos' })).not.toBeInTheDocument()
  })

  it('a raiz leva o agente para a Fila de pedidos, com o menu de agente', async () => {
    simularApi({ 'GET /api/auth/me': [200, ROTA_SUL] })
    renderizarEm('/')
    expect(await screen.findByRole('heading', { name: 'Fila de pedidos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Automóveis' })).toBeInTheDocument()
    expect(screen.getByText('Agente · empresa')).toBeInTheDocument()
  })

  it('cliente numa tela de agente vê Sem permissão', async () => {
    simularApi({ 'GET /api/auth/me': [200, MARINA] })
    renderizarEm('/fila')
    expect(
      await screen.findByRole('heading', { name: 'Você não tem acesso a esta página' }),
    ).toBeInTheDocument()
  })

  it('endereço desconhecido mostra a página 404', async () => {
    simularApi({ 'GET /api/auth/me': [401] })
    renderizarEm('/nao-existe')
    expect(
      await screen.findByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument()
  })
})

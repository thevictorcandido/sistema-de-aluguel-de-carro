import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MARINA, ROTA_SUL, simularApi } from '../test/apiFalsa.js'
import { renderizarEm } from '../test/renderizar.jsx'
import { destinoDepoisDoLogin, itemAtivo, MENU } from './menu.js'

describe('itemAtivo', () => {
  it('escolhe o caminho mais longo que é prefixo do endereço', () => {
    expect(itemAtivo(MENU.CLIENTE, '/pedidos').rotulo).toBe('Meus pedidos')
    expect(itemAtivo(MENU.CLIENTE, '/pedidos/novo').rotulo).toBe('Novo pedido')
    expect(itemAtivo(MENU.CLIENTE, '/pedidos/9').rotulo).toBe('Meus pedidos')
    expect(itemAtivo(MENU.EMPRESA, '/fila/3/modificar').rotulo).toBe('Fila de pedidos')
    expect(itemAtivo(MENU.EMPRESA, '/filas')).toBeUndefined()
  })
})

describe('destinoDepoisDoLogin', () => {
  it('volta para a tela pedida quando ela é do perfil que entrou', () => {
    expect(destinoDepoisDoLogin('CLIENTE', '/pedidos/9')).toBe('/pedidos/9')
    expect(destinoDepoisDoLogin('BANCO', '/fila/3')).toBe('/fila/3')
  })

  it('vai para o início do perfil quando a tela pedida é de outro perfil', () => {
    expect(destinoDepoisDoLogin('EMPRESA', '/pedidos/9')).toBe('/fila')
    expect(destinoDepoisDoLogin('CLIENTE', '/automoveis')).toBe('/pedidos')
    expect(destinoDepoisDoLogin('CLIENTE', undefined)).toBe('/pedidos')
  })
})

describe('Navegação', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('marca o item do menu também dentro de um pedido', async () => {
    simularApi({ 'GET /api/auth/me': [200, ROTA_SUL] })
    renderizarEm('/fila/3')

    const menu = await screen.findByRole('navigation', { name: 'Principal' })
    expect(within(menu).getByRole('link', { name: 'Fila de pedidos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(menu).getByRole('link', { name: 'Contratos' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('o primeiro Tab leva ao link de pular para o conteúdo', async () => {
    simularApi({ 'GET /api/auth/me': [200, MARINA], 'GET /api/pedidos': [200, []] })
    renderizarEm('/pedidos')
    const usuario = userEvent.setup()

    await screen.findByRole('heading', { name: 'Meus pedidos' })
    await usuario.tab()

    const pular = screen.getByRole('link', { name: 'Pular para o conteúdo' })
    expect(pular).toHaveFocus()
    expect(pular).toHaveAttribute('href', '#conteudo')
    expect(document.getElementById('conteudo').tagName).toBe('MAIN')
  })

  it('o menu do celular fecha com Esc e devolve o foco ao botão', async () => {
    simularApi({ 'GET /api/auth/me': [200, MARINA], 'GET /api/pedidos': [200, []] })
    renderizarEm('/pedidos')
    const usuario = userEvent.setup()

    const abrir = await screen.findByRole('button', { name: 'Abrir menu' })
    await usuario.click(abrir)
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveFocus()
    expect(abrir).toHaveAttribute('aria-expanded', 'true')

    await usuario.keyboard('{Escape}')
    expect(abrir).toHaveAttribute('aria-expanded', 'false')
    expect(abrir).toHaveFocus()
  })

  it('a aba do navegador mostra o nome da tela', async () => {
    simularApi({ 'GET /api/auth/me': [200, MARINA], 'GET /api/pedidos': [200, []] })
    renderizarEm('/pedidos')

    await screen.findByRole('heading', { name: 'Meus pedidos' })
    expect(document.title).toBe('Meus pedidos · Aluguel de Carros')
  })

  it('sessão que vence no meio do uso leva para Entrar com o aviso', async () => {
    simularApi({ 'GET /api/auth/me': [200, MARINA], 'GET /api/pedidos': [401] })
    renderizarEm('/pedidos')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(
      screen.getByText('Sua sessão terminou. Entre de novo para continuar.'),
    ).toBeInTheDocument()
  })
})

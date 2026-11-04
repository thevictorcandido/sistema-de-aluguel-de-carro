import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Inicio from './Inicio.jsx'

function simularResposta(ok) {
  const resposta = { ok, status: ok ? 200 : 503, json: () => Promise.resolve({ status: 'ok' }) }
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(resposta)),
  )
}

describe('Inicio', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('mostra que a API está conectada', async () => {
    simularResposta(true)
    render(<Inicio />)
    expect(await screen.findByText('API conectada.')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/api/health', expect.anything())
  })

  it('avisa quando a API não responde', async () => {
    simularResposta(false)
    render(<Inicio />)
    expect(await screen.findByText(/A API não respondeu/)).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Placa from '../Placa/Placa.jsx'
import SeloStatus from '../SeloStatus/SeloStatus.jsx'
import CaminhoPedido, { marcosDoPedido } from './CaminhoPedido.jsx'

const BASE = { dataCriacao: '2026-10-31T09:00:00', parecer: null }

describe('CaminhoPedido', () => {
  it('pedido enviado está no primeiro marco, com a data de criação', () => {
    render(<CaminhoPedido pedido={{ ...BASE, status: 'ENVIADO' }} />)
    const atual = screen.getByRole('listitem', { current: 'step' })
    expect(atual).toHaveTextContent('Enviado31/10/2026')
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('aprovado mostra a data do parecer no marco atual', () => {
    const marcos = marcosDoPedido({
      ...BASE,
      status: 'APROVADO',
      parecer: { data: '2026-11-03T10:00:00' },
    })
    expect(marcos.map((m) => m.estado)).toEqual(['feito', 'feito', 'atual', 'futuro'])
    expect(marcos[2].data).toBe('2026-11-03T10:00:00')
  })

  it('reprovado encerra o caminho no marco Reprovado', () => {
    const marcos = marcosDoPedido({ ...BASE, status: 'REPROVADO', parecer: { data: '2026-11-03' } })
    expect(marcos.map((m) => m.rotulo)).toEqual(['Enviado', 'Em análise', 'Reprovado'])
    expect(marcos.at(-1).estado).toBe('encerrado')
  })

  it('cancelado encerra o caminho', () => {
    const marcos = marcosDoPedido({ ...BASE, status: 'CANCELADO' })
    expect(marcos.map((m) => m.rotulo)).toEqual(['Enviado', 'Cancelado'])
  })
})

describe('Placa e SeloStatus', () => {
  it('a placa é lida caractere por caractere por leitores de tela', () => {
    render(<Placa placa="RTA2F41" />)
    expect(screen.getByRole('img', { name: 'Placa R T A 2 F 4 1' })).toHaveTextContent('RTA2F41')
  })

  it('o selo escreve o status em palavras', () => {
    render(<SeloStatus status="ENVIADO" />)
    expect(screen.getByText('Aguardando análise')).toBeInTheDocument()
  })
})

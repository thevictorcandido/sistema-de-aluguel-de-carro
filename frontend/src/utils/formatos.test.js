import { describe, expect, it } from 'vitest'
import { formatarMoeda, lerMoeda, mascaraCep, mascaraCpf, moedaParaCampo } from './formatos.js'

describe('moeda', () => {
  it('formata em reais', () => {
    expect(formatarMoeda(5500)).toBe('R$ 5.500,00'.replace(' ', ' '))
  })

  it('lê o valor digitado com ou sem separador de milhar', () => {
    expect(lerMoeda('4.200,50')).toBe(4200.5)
    expect(lerMoeda('4200,5')).toBe(4200.5)
    expect(lerMoeda('4200.50')).toBe(4200.5)
    expect(lerMoeda('R$ 1.300')).toBe(1300)
  })

  it('recusa texto que não é valor', () => {
    expect(lerMoeda('')).toBeNull()
    expect(lerMoeda('abc')).toBeNull()
    expect(lerMoeda('10,999')).toBeNull()
  })

  it('volta o valor para o campo no formato de digitação', () => {
    expect(moedaParaCampo(4200.5)).toBe('4200,50')
  })
})

describe('mascaraCpf', () => {
  it('pontua enquanto digita', () => {
    expect(mascaraCpf('123')).toBe('123')
    expect(mascaraCpf('1234')).toBe('123.4')
    expect(mascaraCpf('1234567')).toBe('123.456.7')
    expect(mascaraCpf('12345678909')).toBe('123.456.789-09')
  })

  it('aceita texto colado e corta o excesso', () => {
    expect(mascaraCpf('123.456.789-0999')).toBe('123.456.789-09')
  })
})

describe('mascaraCep', () => {
  it('põe o hífen depois do quinto dígito', () => {
    expect(mascaraCep('30160')).toBe('30160')
    expect(mascaraCep('30160011')).toBe('30160-011')
    expect(mascaraCep('30.160-0119')).toBe('30160-011')
  })
})

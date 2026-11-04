import { describe, expect, it } from 'vitest'
import {
  contarDiarias,
  formatarData,
  formatarMoeda,
  formatarPeriodo,
  lerMoeda,
  mascaraCep,
  mascaraCpf,
  moedaParaCampo,
} from './formatos.js'

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

describe('datas', () => {
  it('mostra a data no formato brasileiro sem mudar o dia por causa do fuso', () => {
    expect(formatarData('2026-11-10')).toBe('10/11/2026')
    expect(formatarData('2026-11-03T23:59:00')).toBe('03/11/2026')
    expect(formatarData(null)).toBe('')
  })

  it('encurta o período quando o ano é o mesmo', () => {
    expect(formatarPeriodo('2026-11-10', '2026-11-19')).toBe('10/11 a 19/11')
    expect(formatarPeriodo('2026-12-30', '2027-01-02')).toBe('30/12/2026 a 02/01/2027')
  })

  it('conta as diárias incluindo início e fim', () => {
    expect(contarDiarias('2026-11-10', '2026-11-19')).toBe(10)
    expect(contarDiarias('2026-11-10', '2026-11-10')).toBe(1)
    expect(contarDiarias('2026-11-10', '2026-11-09')).toBe(0)
    expect(contarDiarias('2026-10-30', '2026-11-02')).toBe(4)
  })
})

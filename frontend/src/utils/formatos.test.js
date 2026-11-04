import { describe, expect, it } from 'vitest'
import { mascaraCep, mascaraCpf } from './formatos.js'

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

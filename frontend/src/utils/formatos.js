// Máscaras aplicadas enquanto a pessoa digita. Aceitam texto colado com ou sem pontuação.

function digitos(valor, limite) {
  return valor.replace(/\D/g, '').slice(0, limite)
}

export function mascaraCpf(valor) {
  const d = digitos(valor, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}

export function mascaraCep(valor) {
  const d = digitos(valor, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatarMoeda(valor) {
  return MOEDA.format(Number(valor))
}

// Lê um valor digitado em reais: "4.200,50", "4200,50" ou "4200.50". Devolve null se não for número.
export function lerMoeda(texto) {
  const limpo = texto.trim().replace(/\s|R\$/g, '')
  const soMilhar = /^\d{1,3}(\.\d{3})+$/.test(limpo)
  const normalizado =
    limpo.includes(',') || soMilhar ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) {
    return null
  }
  return Number(normalizado)
}

// Mostra um número no campo de valor do jeito que se digita em reais: 4200.5 vira "4200,50".
export function moedaParaCampo(valor) {
  return Number(valor).toFixed(2).replace('.', ',')
}

export const UFS = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
]

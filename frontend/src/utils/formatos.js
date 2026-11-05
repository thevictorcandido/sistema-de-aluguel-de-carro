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

// Datas da API chegam como "2026-11-10" ou "2026-11-03T14:20:00"; a tela mostra 10/11/2026.
// Lidas como texto, sem passar por Date, para o fuso não mudar o dia.
export function formatarData(iso) {
  if (!iso) {
    return ''
  }
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

// Período curto da tabela: 10/11 a 19/11. Com anos diferentes, mostra as datas completas.
export function formatarPeriodo(inicio, fim) {
  if (inicio.slice(0, 4) !== fim.slice(0, 4)) {
    return `${formatarData(inicio)} a ${formatarData(fim)}`
  }
  return `${formatarData(inicio).slice(0, 5)} a ${formatarData(fim).slice(0, 5)}`
}

// Data de hoje no formato do campo de data, no fuso de Brasília, o mesmo que a API usa para validar.
export function hojeIso(agora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora)
}

// Diárias contando o dia de início e o de fim, como a API calcula.
export function contarDiarias(inicio, fim) {
  if (!inicio || !fim || fim < inicio) {
    return 0
  }
  const dia = 24 * 60 * 60 * 1000
  return Math.round((Date.parse(fim) - Date.parse(inicio)) / dia) + 1
}

import { vi } from 'vitest'

// Substitui o fetch por respostas por rota: { 'POST /api/auth/login': [200, corpo] }.
// Rota sem resposta definida devolve 404.
export function simularApi(rotas) {
  const chamadas = []
  const fetchFalso = vi.fn(async (url, opcoes = {}) => {
    const chave = `${opcoes.method ?? 'GET'} ${url}`
    chamadas.push({ chave, corpo: opcoes.body ? JSON.parse(opcoes.body) : undefined })
    const resposta = rotas[chave]
    const [status, corpo] =
      typeof resposta === 'function'
        ? resposta()
        : (resposta ?? [404, { mensagem: 'Não encontrado.' }])
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => (corpo === undefined ? '' : JSON.stringify(corpo)),
    }
  })
  vi.stubGlobal('fetch', fetchFalso)
  return chamadas
}

export const MARINA = { id: 5, login: 'marina', nome: 'Marina Costa', perfil: 'CLIENTE' }
export const ROTA_SUL = { id: 1, login: 'rotasul', nome: 'Locadora Rota Sul', perfil: 'EMPRESA' }

// Cliente HTTP da API. O cookie de sessão vai junto porque a origem é a mesma.
export async function apiGet(caminho) {
  const resposta = await fetch(`/api${caminho}`, {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  })
  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status} em ${caminho}`)
  }
  return resposta.json()
}

export function verificarApi() {
  return apiGet('/health')
}

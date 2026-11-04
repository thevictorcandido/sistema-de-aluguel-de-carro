// Cliente HTTP da API. O cookie de sessão vai junto porque front e API estão na mesma origem.

export class ApiError extends Error {
  constructor(status, mensagem, campos = {}) {
    super(mensagem)
    this.status = status
    this.campos = campos
  }
}

const MENSAGEM_PADRAO = 'Não foi possível falar com o servidor. Tente de novo em instantes.'

async function requisicao(metodo, caminho, corpo) {
  let resposta
  try {
    resposta = await fetch(`/api${caminho}`, {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(corpo === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      credentials: 'same-origin',
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
  } catch {
    throw new ApiError(0, MENSAGEM_PADRAO)
  }

  const texto = await resposta.text()
  const dados = texto ? JSON.parse(texto) : null
  if (!resposta.ok) {
    throw new ApiError(resposta.status, dados?.mensagem ?? MENSAGEM_PADRAO, dados?.campos ?? {})
  }
  return dados
}

export const api = {
  get: (caminho) => requisicao('GET', caminho),
  post: (caminho, corpo) => requisicao('POST', caminho, corpo),
  put: (caminho, corpo) => requisicao('PUT', caminho, corpo),
  delete: (caminho) => requisicao('DELETE', caminho),
}

export const auth = {
  entrar: (login, senha) => api.post('/auth/login', { login, senha }),
  sair: () => api.post('/auth/logout'),
  eu: () => api.get('/auth/me'),
}

export const clientes = {
  cadastrar: (dados) => api.post('/clientes', dados),
  meusDados: () => api.get('/clientes/me'),
  atualizar: (dados) => api.put('/clientes/me', dados),
  excluirConta: () => api.delete('/clientes/me'),
  adicionarRendimento: (dados) => api.post('/clientes/me/rendimentos', dados),
  atualizarRendimento: (id, dados) => api.put(`/clientes/me/rendimentos/${id}`, dados),
  removerRendimento: (id) => api.delete(`/clientes/me/rendimentos/${id}`),
}

export const automoveis = {
  listar: () => api.get('/automoveis'),
}

export const pedidos = {
  criar: (dados) => api.post('/pedidos', dados),
  listar: () => api.get('/pedidos'),
  buscar: (id) => api.get(`/pedidos/${id}`),
}

// Menu de cada perfil, conforme o DESIGN.md. A primeira entrada é a tela inicial do perfil.
export const MENU = {
  CLIENTE: [
    { caminho: '/pedidos', rotulo: 'Meus pedidos' },
    { caminho: '/pedidos/novo', rotulo: 'Novo pedido' },
    { caminho: '/meus-dados', rotulo: 'Meus dados' },
  ],
  EMPRESA: [
    { caminho: '/fila', rotulo: 'Fila de pedidos' },
    { caminho: '/contratos', rotulo: 'Contratos' },
    { caminho: '/automoveis', rotulo: 'Automóveis' },
  ],
  BANCO: [
    { caminho: '/fila', rotulo: 'Fila de pedidos' },
    { caminho: '/contratos', rotulo: 'Contratos e créditos' },
    { caminho: '/automoveis', rotulo: 'Automóveis' },
  ],
}

export const DESCRICAO_PERFIL = {
  CLIENTE: 'Cliente',
  EMPRESA: 'Agente · empresa',
  BANCO: 'Agente · banco',
}

export const AGENTES = ['EMPRESA', 'BANCO']

export function inicioDoPerfil(perfil) {
  return MENU[perfil]?.[0].caminho ?? '/entrar'
}

// Item do menu da tela atual: o de caminho mais longo que é prefixo do endereço.
// Assim /fila/12 marca "Fila de pedidos", e /pedidos/novo marca "Novo pedido", não "Meus pedidos".
export function itemAtivo(itens, caminhoAtual) {
  return itens
    .filter((item) => caminhoAtual === item.caminho || caminhoAtual.startsWith(`${item.caminho}/`))
    .sort((a, b) => b.caminho.length - a.caminho.length)[0]
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { auth, EVENTO_SESSAO_EXPIRADA } from '../services/api.js'

const SessaoContext = createContext(null)

// Guarda quem está logado. O token fica no cookie HttpOnly; aqui ficam só os dados de /api/auth/me.
export function SessaoProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [expirou, setExpirou] = useState(false)

  useEffect(() => {
    let ativo = true
    auth
      .eu()
      .then((dados) => ativo && setUsuario(dados))
      .catch(() => ativo && setUsuario(null))
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [])

  // A API respondeu 401 no meio do uso: limpa a sessão, e a rota protegida leva para Entrar
  useEffect(() => {
    function aoExpirar() {
      setUsuario((atual) => {
        if (atual) {
          setExpirou(true)
        }
        return null
      })
    }
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar)
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar)
  }, [])

  const entrar = useCallback(async (login, senha) => {
    const dados = await auth.entrar(login, senha)
    setExpirou(false)
    setUsuario(dados)
    return dados
  }, [])

  const sair = useCallback(async () => {
    try {
      await auth.sair()
    } finally {
      setUsuario(null)
    }
  }, [])

  const valor = useMemo(
    () => ({ usuario, carregando, expirou, entrar, sair }),
    [usuario, carregando, expirou, entrar, sair],
  )

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>
}

export function useSessao() {
  const contexto = useContext(SessaoContext)
  if (!contexto) {
    throw new Error('useSessao precisa estar dentro de SessaoProvider')
  }
  return contexto
}

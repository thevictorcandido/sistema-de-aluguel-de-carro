import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

// Aviso que outra tela manda ao navegar ("Pedido enviado."). Depois de lido, sai do histórico,
// para não aparecer de novo ao recarregar a página ou voltar para ela.
export function useAvisoDeNavegacao() {
  const local = useLocation()
  const navegar = useNavigate()
  const [aviso, setAviso] = useState(local.state?.aviso ?? '')

  useEffect(() => {
    if (local.state?.aviso) {
      navegar(local.pathname, { replace: true, state: null })
    }
  }, [local.state, local.pathname, navegar])

  const limparAviso = useCallback(() => setAviso(''), [])
  return [aviso, setAviso, limparAviso]
}

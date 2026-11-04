import { Navigate, Outlet, useLocation } from 'react-router'
import { useSessao } from '../contexts/SessaoContext.jsx'
import SemPermissao from '../pages/SemPermissao/SemPermissao.jsx'

// Sem login, volta para Entrar e lembra de onde veio. Com login de outro perfil, mostra Sem permissão.
export default function RotaProtegida({ perfis }) {
  const { usuario, carregando } = useSessao()
  const local = useLocation()

  if (carregando) {
    return null
  }
  if (!usuario) {
    return <Navigate to="/entrar" replace state={{ de: local.pathname }} />
  }
  if (perfis && !perfis.includes(usuario.perfil)) {
    return <SemPermissao />
  }
  return <Outlet />
}

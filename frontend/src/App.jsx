import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import Moldura from './components/Moldura/Moldura.jsx'
import { SessaoProvider, useSessao } from './contexts/SessaoContext.jsx'
import CriarConta from './pages/CriarConta/CriarConta.jsx'
import EmConstrucao from './pages/EmConstrucao/EmConstrucao.jsx'
import Entrar from './pages/Entrar/Entrar.jsx'
import NaoEncontrado from './pages/NaoEncontrado/NaoEncontrado.jsx'
import { AGENTES, inicioDoPerfil } from './routes/menu.js'
import RotaProtegida from './routes/RotaProtegida.jsx'

function Inicio() {
  const { usuario } = useSessao()
  return <Navigate to={inicioDoPerfil(usuario.perfil)} replace />
}

export function Rotas() {
  return (
    <Routes>
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/criar-conta" element={<CriarConta />} />

      <Route element={<RotaProtegida />}>
        <Route element={<Moldura />}>
          <Route index element={<Inicio />} />

          <Route element={<RotaProtegida perfis={['CLIENTE']} />}>
            <Route path="/pedidos" element={<EmConstrucao titulo="Meus pedidos" tarefa={5} />} />
            <Route
              path="/pedidos/novo"
              element={<EmConstrucao titulo="Novo pedido" tarefa={5} />}
            />
            <Route path="/meus-dados" element={<EmConstrucao titulo="Meus dados" tarefa={4} />} />
          </Route>

          <Route element={<RotaProtegida perfis={AGENTES} />}>
            <Route path="/fila" element={<EmConstrucao titulo="Fila de pedidos" tarefa={7} />} />
            <Route path="/contratos" element={<EmConstrucao titulo="Contratos" tarefa={8} />} />
            <Route path="/automoveis" element={<EmConstrucao titulo="Automóveis" tarefa={9} />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NaoEncontrado />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SessaoProvider>
        <Rotas />
      </SessaoProvider>
    </BrowserRouter>
  )
}

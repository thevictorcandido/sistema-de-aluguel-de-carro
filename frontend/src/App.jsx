import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import Moldura from './components/Moldura/Moldura.jsx'
import { SessaoProvider, useSessao } from './contexts/SessaoContext.jsx'
import CriarConta from './pages/CriarConta/CriarConta.jsx'
import DetalhePedido from './pages/DetalhePedido/DetalhePedido.jsx'
import EmConstrucao from './pages/EmConstrucao/EmConstrucao.jsx'
import Entrar from './pages/Entrar/Entrar.jsx'
import MeusDados from './pages/MeusDados/MeusDados.jsx'
import MeusPedidos from './pages/MeusPedidos/MeusPedidos.jsx'
import NaoEncontrado from './pages/NaoEncontrado/NaoEncontrado.jsx'
import NovoPedido from './pages/NovoPedido/NovoPedido.jsx'
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
            <Route path="/pedidos" element={<MeusPedidos />} />
            <Route path="/pedidos/novo" element={<NovoPedido />} />
            <Route path="/pedidos/:id" element={<DetalhePedido />} />
            <Route path="/pedidos/:id/modificar" element={<NovoPedido />} />
            <Route path="/meus-dados" element={<MeusDados />} />
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

import { LogOut, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useSessao } from '../../contexts/SessaoContext.jsx'
import { DESCRICAO_PERFIL, MENU } from '../../routes/menu.js'
import Marca from '../Marca/Marca.jsx'
import styles from './Moldura.module.css'

// Moldura em L do DESIGN.md: barra lateral e barra superior no mesmo tom, conteúdo numa folha branca.
export default function Moldura() {
  const { usuario, sair } = useSessao()
  const navegar = useNavigate()
  const local = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)

  // Fecha o menu do celular ao trocar de tela
  // biome-ignore lint/correctness/useExhaustiveDependencies: reage só à mudança de rota
  useEffect(() => setMenuAberto(false), [local.pathname])

  async function aoSair() {
    await sair()
    navegar('/entrar', { replace: true })
  }

  return (
    <div className={styles.app}>
      <aside className={styles.lateral} data-aberta={menuAberto || undefined}>
        <div className={styles.marca}>
          <Marca />
          <button
            type="button"
            className={styles.fecharMenu}
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Principal">
          <ul className={styles.menu}>
            {MENU[usuario.perfil].map((item) => (
              <li key={item.caminho}>
                <NavLink to={item.caminho} end className={styles.link}>
                  {item.rotulo}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <header className={styles.topo}>
        <button
          type="button"
          className={styles.abrirMenu}
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
        >
          <Menu size={18} aria-hidden="true" />
        </button>
        <div className={styles.conta}>
          <span className={styles.quem}>
            <b>{usuario.nome}</b>
            <span>{DESCRICAO_PERFIL[usuario.perfil]}</span>
          </span>
          <button type="button" className={styles.sair} onClick={aoSair}>
            <LogOut size={16} aria-hidden="true" />
            Sair
          </button>
        </div>
      </header>

      <main className={styles.folha}>
        <Outlet />
      </main>
    </div>
  )
}

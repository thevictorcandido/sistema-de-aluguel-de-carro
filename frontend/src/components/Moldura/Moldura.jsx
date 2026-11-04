import { LogOut, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { useSessao } from '../../contexts/SessaoContext.jsx'
import { DESCRICAO_PERFIL, itemAtivo, MENU } from '../../routes/menu.js'
import Marca from '../Marca/Marca.jsx'
import styles from './Moldura.module.css'

// Moldura em L do DESIGN.md: barra lateral e barra superior no mesmo tom, conteúdo numa folha branca.
export default function Moldura() {
  const { usuario, sair } = useSessao()
  const navegar = useNavigate()
  const local = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)
  const botaoMenu = useRef(null)
  const fecharMenu = useRef(null)
  const itens = MENU[usuario.perfil]
  const ativo = itemAtivo(itens, local.pathname)

  // Fecha o menu do celular ao trocar de tela
  // biome-ignore lint/correctness/useExhaustiveDependencies: reage só à mudança de rota
  useEffect(() => setMenuAberto(false), [local.pathname])

  // Menu do celular: o foco entra no painel ao abrir, Esc fecha e o foco volta ao botão
  useEffect(() => {
    if (!menuAberto) {
      return undefined
    }
    fecharMenu.current?.focus()
    function aoTeclar(evento) {
      if (evento.key === 'Escape') {
        setMenuAberto(false)
        botaoMenu.current?.focus()
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [menuAberto])

  async function aoSair() {
    await sair()
    navegar('/entrar', { replace: true })
  }

  return (
    <div className={styles.app}>
      <a className={styles.pular} href="#conteudo">
        Pular para o conteúdo
      </a>

      <aside className={styles.lateral} data-aberta={menuAberto || undefined}>
        <div className={styles.marca}>
          <Marca />
          <button
            ref={fecharMenu}
            type="button"
            className={styles.fecharMenu}
            onClick={() => {
              setMenuAberto(false)
              botaoMenu.current?.focus()
            }}
            aria-label="Fechar menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Principal">
          <ul className={styles.menu}>
            {itens.map((item) => (
              <li key={item.caminho}>
                <Link
                  to={item.caminho}
                  className={styles.link}
                  aria-current={item === ativo ? 'page' : undefined}
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <header className={styles.topo}>
        <button
          ref={botaoMenu}
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

      <main id="conteudo" className={styles.folha} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}

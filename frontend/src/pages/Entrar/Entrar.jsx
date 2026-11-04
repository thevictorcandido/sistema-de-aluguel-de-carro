import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import Aviso from '../../components/Aviso/Aviso.jsx'
import Botao from '../../components/Botao/Botao.jsx'
import Campo from '../../components/Campo/Campo.jsx'
import Marca from '../../components/Marca/Marca.jsx'
import { useSessao } from '../../contexts/SessaoContext.jsx'
import { inicioDoPerfil } from '../../routes/menu.js'
import { useTituloPagina } from '../../utils/useTituloPagina.js'
import styles from './Acesso.module.css'

export default function Entrar() {
  useTituloPagina('Entrar')
  const { usuario, carregando, expirou, entrar } = useSessao()
  const local = useLocation()
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Logado, segue para a tela que tentou abrir antes do login ou para a inicial do perfil.
  // Também é o que redireciona logo depois de entrar, quando a sessão é preenchida.
  if (!carregando && usuario) {
    return <Navigate to={local.state?.de ?? inicioDoPerfil(usuario.perfil)} replace />
  }

  async function aoEnviar(evento) {
    evento.preventDefault()
    setErros({})
    setErroGeral('')
    setEnviando(true)
    try {
      await entrar(login, senha)
    } catch (erro) {
      setErros(erro.campos ?? {})
      setErroGeral(Object.keys(erro.campos ?? {}).length ? '' : erro.message)
      setEnviando(false)
    }
  }

  return (
    <main className={styles.pagina}>
      <section className={styles.folha} aria-labelledby="titulo-entrar">
        <Marca />
        <h1 id="titulo-entrar" className={styles.titulo}>
          Entrar
        </h1>
        <p className={styles.sub}>Clientes, empresas e bancos usam o mesmo acesso.</p>
        {expirou && (
          <p className={styles.informe} role="status">
            Sua sessão terminou. Entre de novo para continuar.
          </p>
        )}

        <form className={styles.formulario} onSubmit={aoEnviar} noValidate>
          <Campo
            rotulo="Usuário"
            name="login"
            autoComplete="username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            erro={erros.login}
          />
          <Campo
            rotulo="Senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            erro={erros.senha}
          />
          <Aviso>{erroGeral}</Aviso>
          <Botao variante="principal" type="submit" className={styles.acao} disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Botao>
        </form>

        <p className={styles.rodape}>
          Ainda não tem conta? <Link to="/criar-conta">Criar conta</Link>
        </p>
      </section>
    </main>
  )
}

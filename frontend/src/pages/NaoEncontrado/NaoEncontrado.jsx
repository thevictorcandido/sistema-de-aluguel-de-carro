import { Link } from 'react-router'
import Marca from '../../components/Marca/Marca.jsx'
import acesso from '../Entrar/Acesso.module.css'
import styles from '../Pagina.module.css'

export default function NaoEncontrado() {
  return (
    <main className={acesso.pagina}>
      <section className={acesso.folha}>
        <Marca />
        <h1 className={acesso.titulo}>Página não encontrada</h1>
        <p className={acesso.sub}>O endereço pode estar errado ou a página foi removida.</p>
        <p className={styles.acoes}>
          <Link to="/">Voltar para o início</Link>
        </p>
      </section>
    </main>
  )
}

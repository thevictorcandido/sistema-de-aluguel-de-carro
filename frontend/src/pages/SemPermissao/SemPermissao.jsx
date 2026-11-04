import { Link } from 'react-router'
import { useTituloPagina } from '../../utils/useTituloPagina.js'
import styles from '../Pagina.module.css'

export default function SemPermissao() {
  useTituloPagina('Sem acesso')
  return (
    <>
      <h1 className={styles.titulo}>Você não tem acesso a esta página</h1>
      <p className={styles.sub}>Ela é de outro perfil de usuário.</p>
      <p className={styles.acoes}>
        <Link to="/">Voltar para o início</Link>
      </p>
    </>
  )
}

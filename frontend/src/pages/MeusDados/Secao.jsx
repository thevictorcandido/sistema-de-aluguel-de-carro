import { useId } from 'react'
import styles from './MeusDados.module.css'

export default function Secao({ titulo, descricao, children }) {
  const id = useId()
  return (
    <section className={styles.secao} aria-labelledby={id}>
      <div className={styles.rotulo}>
        <h2 id={id}>{titulo}</h2>
        {descricao && <p>{descricao}</p>}
      </div>
      <div className={styles.painel}>{children}</div>
    </section>
  )
}

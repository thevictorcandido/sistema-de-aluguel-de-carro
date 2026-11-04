import styles from './Aviso.module.css'

// Faixa de erro geral de um formulário ou de uma tela.
export default function Aviso({ children }) {
  if (!children) {
    return null
  }
  return (
    <p className={styles.aviso} role="alert">
      {children}
    </p>
  )
}

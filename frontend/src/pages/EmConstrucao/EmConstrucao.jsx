import styles from '../Pagina.module.css'

// Tela do menu que ainda não foi construída. Some quando a tarefa indicada entrar.
export default function EmConstrucao({ titulo, tarefa }) {
  return (
    <>
      <h1 className={styles.titulo}>{titulo}</h1>
      <p className={styles.sub}>Esta tela entra na tarefa {tarefa} do plano de construção.</p>
    </>
  )
}

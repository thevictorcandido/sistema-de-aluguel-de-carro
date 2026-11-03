import styles from './Marca.module.css'

export default function Marca() {
  return (
    <span className={styles.marca}>
      <span className={styles.placa} aria-hidden="true">
        <span>AC</span>
      </span>
      Aluguel de Carros
    </span>
  )
}

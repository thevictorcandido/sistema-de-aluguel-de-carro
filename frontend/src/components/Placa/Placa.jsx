import styles from './Placa.module.css'

// Placa Mercosul desenhada: identidade do automóvel em todo o sistema (DESIGN.md).
export default function Placa({ placa, grande = false }) {
  return (
    <span
      className={[styles.placa, grande ? styles.grande : null].filter(Boolean).join(' ')}
      role="img"
      aria-label={`Placa ${placa.split('').join(' ')}`}
    >
      <b aria-hidden="true">{placa}</b>
    </span>
  )
}

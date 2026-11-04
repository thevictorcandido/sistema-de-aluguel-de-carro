import { useEffect } from 'react'
import styles from './Toast.module.css'

const DURACAO_MS = 4000

// Aviso discreto de ação concluída, no canto inferior, que some sozinho em 4 segundos.
export default function Toast({ mensagem, aoSumir }) {
  useEffect(() => {
    if (!mensagem) {
      return undefined
    }
    const tempo = setTimeout(aoSumir, DURACAO_MS)
    return () => clearTimeout(tempo)
  }, [mensagem, aoSumir])

  return (
    <div className={styles.area} role="status" aria-live="polite">
      {mensagem && <p className={styles.toast}>{mensagem}</p>}
    </div>
  )
}

import { useEffect, useRef } from 'react'
import styles from './Dialogo.module.css'

// <dialog> nativo do DESIGN.md: prende o foco, fecha com Esc e devolve o foco a quem abriu.
export default function Dialogo({ aberto, titulo, aoFechar, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialogo = ref.current
    if (aberto && !dialogo.open) {
      dialogo.showModal()
    } else if (!aberto && dialogo.open) {
      dialogo.close()
    }
  }, [aberto])

  return (
    <dialog
      ref={ref}
      className={styles.dialogo}
      aria-labelledby="titulo-dialogo"
      onClose={aoFechar}
    >
      {aberto && (
        <>
          <h2 id="titulo-dialogo" className={styles.titulo}>
            {titulo}
          </h2>
          {children}
        </>
      )}
    </dialog>
  )
}

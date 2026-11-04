import { useId } from 'react'
import styles from './Campo.module.css'

// Rótulo acima, campo e erro abaixo, ligado por aria-describedby. Com `opcoes`, vira um select.
export default function Campo({ rotulo, erro, ajuda, opcoes, className, ...props }) {
  const id = useId()
  const idErro = `${id}-erro`
  const idAjuda = `${id}-ajuda`
  const descritoPor =
    [erro ? idErro : null, ajuda ? idAjuda : null].filter(Boolean).join(' ') || undefined
  const comuns = {
    id,
    className: styles.controle,
    'aria-invalid': erro ? true : undefined,
    'aria-describedby': descritoPor,
    ...props,
  }

  return (
    <div className={[styles.campo, className].filter(Boolean).join(' ')}>
      <label className={styles.rotulo} htmlFor={id}>
        {rotulo}
      </label>
      {opcoes ? (
        <select {...comuns}>
          <option value="">Escolha</option>
          {opcoes.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      ) : (
        <input {...comuns} />
      )}
      {ajuda && !erro && (
        <p className={styles.ajuda} id={idAjuda}>
          {ajuda}
        </p>
      )}
      {erro && (
        <p className={styles.erro} id={idErro}>
          {erro}
        </p>
      )}
    </div>
  )
}

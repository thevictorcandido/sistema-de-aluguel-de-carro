import styles from './Botao.module.css'

// variante: 'principal' (um por tela), 'secundario' ou 'perigo'
export default function Botao({ variante = 'secundario', className, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={[styles.botao, styles[variante], className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

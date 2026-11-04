import { Link } from 'react-router'
import styles from './Botao.module.css'

function classes(variante, className) {
  return [styles.botao, styles[variante], className].filter(Boolean).join(' ')
}

// variante: 'principal' (um por tela), 'secundario', 'perigo' ou 'perigoCheio' (só em diálogo)
export default function Botao({ variante = 'secundario', className, type = 'button', ...props }) {
  return <button type={type} className={classes(variante, className)} {...props} />
}

// Link com a aparência de botão, para ações que levam a outra tela.
export function BotaoLink({ variante = 'secundario', className, ...props }) {
  return <Link className={classes(variante, className)} {...props} />
}

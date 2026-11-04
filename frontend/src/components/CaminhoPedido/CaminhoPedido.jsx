import { formatarData } from '../../utils/formatos.js'
import styles from './CaminhoPedido.module.css'

// Monta os marcos do caminho Enviado → Em análise → Aprovado → Contratado.
// Reprovado e cancelado encerram o caminho no marco em que o pedido parou.
export function marcosDoPedido(pedido) {
  const enviado = { rotulo: 'Enviado', data: pedido.dataCriacao }
  const dataParecer = pedido.parecer?.data
  const passo = (rotulo, estado, data) => ({ rotulo, estado, data })

  switch (pedido.status) {
    case 'ENVIADO':
      return [
        passo(enviado.rotulo, 'atual', enviado.data),
        passo('Em análise', 'futuro'),
        passo('Aprovado', 'futuro'),
        passo('Contratado', 'futuro'),
      ]
    case 'EM_ANALISE':
      return [
        passo(enviado.rotulo, 'feito', enviado.data),
        passo('Em análise', 'atual'),
        passo('Aprovado', 'futuro'),
        passo('Contratado', 'futuro'),
      ]
    case 'APROVADO':
      return [
        passo(enviado.rotulo, 'feito', enviado.data),
        passo('Em análise', 'feito'),
        passo('Aprovado', 'atual', dataParecer),
        passo('Contratado', 'futuro'),
      ]
    case 'CONTRATADO':
      return [
        passo(enviado.rotulo, 'feito', enviado.data),
        passo('Em análise', 'feito'),
        passo('Aprovado', 'feito', dataParecer),
        passo('Contratado', 'atual'),
      ]
    case 'REPROVADO':
      return [
        passo(enviado.rotulo, 'feito', enviado.data),
        passo('Em análise', 'feito'),
        passo('Reprovado', 'encerrado', dataParecer),
      ]
    default:
      return [passo(enviado.rotulo, 'feito', enviado.data), passo('Cancelado', 'encerrado')]
  }
}

export default function CaminhoPedido({ pedido }) {
  return (
    <ol className={styles.caminho} aria-label="Andamento do pedido">
      {marcosDoPedido(pedido).map((marco) => (
        <li
          key={marco.rotulo}
          className={styles[marco.estado]}
          aria-current={marco.estado === 'atual' ? 'step' : undefined}
        >
          {marco.rotulo}
          {marco.data && <small>{formatarData(marco.data)}</small>}
        </li>
      ))}
    </ol>
  )
}

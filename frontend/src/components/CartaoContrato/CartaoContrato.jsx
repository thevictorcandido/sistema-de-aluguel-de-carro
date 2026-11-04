import { formatarData, formatarMoeda } from '../../utils/formatos.js'
import styles from './CartaoContrato.module.css'

export const TIPO_CONTRATO = {
  PROPRIEDADE_CLIENTE: 'Propriedade do cliente',
  PROPRIEDADE_EMPRESA: 'Propriedade da empresa',
  PROPRIEDADE_BANCO: 'Propriedade do banco',
}

const TAXA = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

// Contrato executado: quem ficou proprietário do automóvel e o crédito, quando houver (US11 e US12).
export default function CartaoContrato({ contrato, className }) {
  return (
    <section
      className={[styles.cartao, className].filter(Boolean).join(' ')}
      aria-labelledby="titulo-contrato"
    >
      <h2 id="titulo-contrato">Contrato</h2>
      <dl className={styles.dados}>
        <dt>Tipo</dt>
        <dd>{TIPO_CONTRATO[contrato.tipo]}</dd>
        <dt>Proprietário do automóvel</dt>
        <dd>{contrato.proprietario}</dd>
        <dt>Executado por</dt>
        <dd>{contrato.executadoPor}</dd>
        <dt>Assinatura</dt>
        <dd>{formatarData(contrato.dataAssinatura)}</dd>
        <dt>Crédito</dt>
        <dd>
          {contrato.credito
            ? `${formatarMoeda(contrato.credito.valor)} em ${contrato.credito.parcelas}x, ${TAXA.format(contrato.credito.taxaJuros)}% ao mês, pelo ${contrato.credito.banco}`
            : 'Sem contrato de crédito'}
        </dd>
      </dl>
    </section>
  )
}

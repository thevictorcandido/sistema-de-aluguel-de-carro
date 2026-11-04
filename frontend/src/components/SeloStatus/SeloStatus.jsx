import styles from './SeloStatus.module.css'

// Rótulos da tabela de status do DESIGN.md. O selo sempre tem o texto, nunca só a cor.
export const STATUS = {
  ENVIADO: { rotulo: 'Aguardando análise', plural: 'Aguardando análise', classe: 'enviado' },
  EM_ANALISE: { rotulo: 'Em análise', plural: 'Em análise', classe: 'analise' },
  APROVADO: { rotulo: 'Aprovado', plural: 'Aprovados', classe: 'aprovado' },
  REPROVADO: { rotulo: 'Reprovado', plural: 'Reprovados', classe: 'reprovado' },
  CONTRATADO: { rotulo: 'Contratado', plural: 'Contratados', classe: 'contratado' },
  CANCELADO: { rotulo: 'Cancelado', plural: 'Cancelados', classe: 'cancelado' },
}

export default function SeloStatus({ status }) {
  const { rotulo, classe } = STATUS[status]
  return <span className={`${styles.selo} ${styles[classe]}`}>{rotulo}</span>
}

import { useState } from 'react'
import Aviso from '../../components/Aviso/Aviso.jsx'
import Botao from '../../components/Botao/Botao.jsx'
import Campo from '../../components/Campo/Campo.jsx'
import { useSessao } from '../../contexts/SessaoContext.jsx'
import { pedidos as apiPedidos } from '../../services/api.js'
import { lerMoeda, moedaParaCampo } from '../../utils/formatos.js'
import styles from '../Pedidos.module.css'

// Três opções grandes, cada uma dizendo quem fica proprietário do automóvel com o nome real (DESIGN.md).
// A opção da empresa só aparece para empresas, e a do banco só para bancos, com os campos do crédito.
function opcoesPara(usuario, pedido) {
  const opcoes = [
    {
      tipo: 'PROPRIEDADE_CLIENTE',
      titulo: 'O cliente fica proprietário',
      detalhe: `${pedido.cliente.nome} passa a ser dono do automóvel.`,
    },
  ]
  // A empresa só fica com um carro que já é dela; não toma o automóvel de outro agente
  if (usuario.perfil === 'EMPRESA' && pedido.automovel.proprietarioId === usuario.id) {
    opcoes.push({
      tipo: 'PROPRIEDADE_EMPRESA',
      titulo: 'A empresa fica proprietária',
      detalhe: `${usuario.nome} continua dona do automóvel.`,
    })
  }
  if (usuario.perfil === 'BANCO') {
    opcoes.push({
      tipo: 'PROPRIEDADE_BANCO',
      titulo: 'O banco fica proprietário',
      detalhe: `${usuario.nome} passa a ser dono do automóvel e financia o aluguel.`,
    })
  }
  return opcoes
}

export default function ExecutarContrato({ pedido, aoExecutar, aoCancelar }) {
  const { usuario } = useSessao()
  const banco = usuario.perfil === 'BANCO'
  const [tipo, setTipo] = useState(null)
  const [comCredito, setComCredito] = useState(false)
  const [credito, setCredito] = useState({
    valor: moedaParaCampo(pedido.valorTotal),
    taxaJuros: '',
    parcelas: '',
  })
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  const creditoObrigatorio = tipo === 'PROPRIEDADE_BANCO'
  const mostraCredito = banco && (creditoObrigatorio || comCredito)

  async function enviar(evento) {
    evento.preventDefault()
    const errosLocais = {}
    const valor = lerMoeda(credito.valor)
    const taxa = lerMoeda(credito.taxaJuros)
    if (mostraCredito && credito.valor.trim() && valor === null) {
      errosLocais['credito.valor'] = 'Use só números, como 1.800,00.'
    }
    if (mostraCredito && credito.taxaJuros.trim() && taxa === null) {
      errosLocais['credito.taxaJuros'] = 'Use só números, como 1,20.'
    }
    if (Object.keys(errosLocais).length) {
      setErros(errosLocais)
      return
    }
    setErros({})
    setErroGeral('')
    setEnviando(true)
    try {
      const dados = {
        tipo,
        credito: mostraCredito
          ? { valor, taxaJuros: taxa, parcelas: credito.parcelas ? Number(credito.parcelas) : null }
          : null,
      }
      aoExecutar(await apiPedidos.executarContrato(pedido.id, dados))
    } catch (falha) {
      setErros(falha.campos ?? {})
      setErroGeral(falha.message)
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <fieldset className={styles.tipos} aria-describedby={erros.tipo ? 'erro-tipo' : undefined}>
        <legend className={styles.rotuloCampo}>Quem fica proprietário do automóvel?</legend>
        {opcoesPara(usuario, pedido).map((opcao) => (
          <label key={opcao.tipo} className={styles.opcaoTipo}>
            <input
              type="radio"
              name="tipo"
              checked={tipo === opcao.tipo}
              onChange={() => setTipo(opcao.tipo)}
            />
            <span>
              <b>{opcao.titulo}</b>
              <small>{opcao.detalhe}</small>
            </span>
          </label>
        ))}
        {erros.tipo && (
          <p className={styles.erroCampo} id="erro-tipo">
            {erros.tipo}
          </p>
        )}
      </fieldset>

      {banco && !creditoObrigatorio && (
        <label className={styles.marcar}>
          <input
            type="checkbox"
            checked={comCredito}
            onChange={(e) => setComCredito(e.target.checked)}
          />
          Associar um contrato de crédito do {usuario.nome}
        </label>
      )}

      {mostraCredito && (
        <fieldset className={styles.credito}>
          <legend className={styles.rotuloCampo}>Contrato de crédito</legend>
          <Campo
            rotulo="Valor (R$)"
            inputMode="decimal"
            value={credito.valor}
            onChange={(e) => setCredito((c) => ({ ...c, valor: e.target.value }))}
            erro={erros['credito.valor']}
          />
          <div className={styles.parCredito}>
            <Campo
              rotulo="Juros ao mês (%)"
              inputMode="decimal"
              value={credito.taxaJuros}
              onChange={(e) => setCredito((c) => ({ ...c, taxaJuros: e.target.value }))}
              erro={erros['credito.taxaJuros']}
            />
            <Campo
              rotulo="Parcelas"
              type="number"
              min={1}
              max={60}
              value={credito.parcelas}
              onChange={(e) => setCredito((c) => ({ ...c, parcelas: e.target.value }))}
              erro={erros['credito.parcelas']}
            />
          </div>
        </fieldset>
      )}

      <Aviso>{erros.credito ?? erroGeral}</Aviso>
      <div className={styles.acoesDialogo}>
        <Botao onClick={aoCancelar} disabled={enviando}>
          Voltar
        </Botao>
        <Botao variante="principal" type="submit" disabled={enviando}>
          {enviando ? 'Executando…' : 'Executar contrato'}
        </Botao>
      </div>
    </form>
  )
}

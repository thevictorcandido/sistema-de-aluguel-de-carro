import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import Aviso from '../../components/Aviso/Aviso.jsx'
import Botao from '../../components/Botao/Botao.jsx'
import Campo from '../../components/Campo/Campo.jsx'
import Placa from '../../components/Placa/Placa.jsx'
import { automoveis as apiAutomoveis, pedidos as apiPedidos } from '../../services/api.js'
import { contarDiarias, formatarMoeda, hojeIso } from '../../utils/formatos.js'
import pagina from '../Pagina.module.css'
import styles from '../Pedidos.module.css'

export default function NovoPedido() {
  const navegar = useNavigate()
  const hoje = hojeIso()
  const [carros, setCarros] = useState(null)
  const [erroCarga, setErroCarga] = useState('')
  const [automovelId, setAutomovelId] = useState(null)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    apiAutomoveis
      .listar()
      .then(setCarros)
      .catch((falha) => setErroCarga(falha.message))
  }, [])

  const escolhido = carros?.find((c) => c.id === automovelId)
  const diarias = contarDiarias(dataInicio, dataFim)
  const total = escolhido && diarias > 0 ? escolhido.valorDiaria * diarias : null

  async function enviar(evento) {
    evento.preventDefault()
    setErros({})
    setErroGeral('')
    setEnviando(true)
    try {
      const pedido = await apiPedidos.criar({
        automovelId,
        dataInicio: dataInicio || null,
        dataFim: dataFim || null,
      })
      navegar(`/pedidos/${pedido.id}`, { state: { aviso: 'Pedido enviado.' } })
    } catch (falha) {
      setErros(falha.campos ?? {})
      setErroGeral(falha.message)
      setEnviando(false)
    }
  }

  return (
    <>
      <div className={styles.tituloLinha}>
        <div>
          <h1 className={pagina.titulo}>Novo pedido</h1>
          <p className={pagina.sub}>Escolha o automóvel e as datas. O valor é calculado na hora.</p>
        </div>
      </div>

      {erroCarga && (
        <div className={styles.faixaErro} role="alert">
          {erroCarga}
        </div>
      )}

      <form className={styles.formulario} onSubmit={enviar} noValidate>
        <fieldset
          className={styles.carros}
          aria-describedby={erros.automovelId ? 'erro-carro' : undefined}
        >
          <legend className={styles.legenda}>Automóvel</legend>
          {!carros && !erroCarga && (
            <div className={styles.esqueleto} role="status" aria-label="Carregando automóveis" />
          )}
          {carros && (
            <div className={styles.opcoes}>
              {carros.map((carro) => (
                <label key={carro.id} className={styles.opcao}>
                  <input
                    type="radio"
                    name="automovel"
                    value={carro.id}
                    checked={automovelId === carro.id}
                    onChange={() => setAutomovelId(carro.id)}
                  />
                  <Placa placa={carro.placa} />
                  <span>
                    {carro.marca} {carro.modelo} {carro.ano}
                  </span>
                  <small>{formatarMoeda(carro.valorDiaria)} por dia</small>
                </label>
              ))}
            </div>
          )}
          {erros.automovelId && (
            <p className={styles.erroCampo} id="erro-carro">
              {erros.automovelId}
            </p>
          )}
        </fieldset>

        <aside className={styles.resumo} aria-labelledby="titulo-resumo">
          <h2 id="titulo-resumo">Período e valor</h2>
          <Campo
            rotulo="Início"
            type="date"
            min={hoje}
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            erro={erros.dataInicio}
          />
          <Campo
            rotulo="Fim"
            type="date"
            min={dataInicio || hoje}
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            erro={erros.dataFim}
          />
          {total !== null ? (
            <div className={styles.conta} aria-live="polite">
              <span className={styles.ajuda}>
                {diarias} {diarias === 1 ? 'diária' : 'diárias'} de{' '}
                {formatarMoeda(escolhido.valorDiaria)}
              </span>
              <span className={styles.total}>{formatarMoeda(total)}</span>
            </div>
          ) : (
            <p className={styles.ajuda}>
              {escolhido ? 'Informe as datas para ver o valor.' : 'Escolha um automóvel.'}
            </p>
          )}
          <Aviso>{erroGeral}</Aviso>
          <Botao variante="principal" type="submit" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar pedido'}
          </Botao>
        </aside>
      </form>
    </>
  )
}

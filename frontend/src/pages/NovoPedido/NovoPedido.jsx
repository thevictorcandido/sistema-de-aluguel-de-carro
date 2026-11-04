import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Aviso from '../../components/Aviso/Aviso.jsx'
import Botao from '../../components/Botao/Botao.jsx'
import Campo from '../../components/Campo/Campo.jsx'
import Dialogo from '../../components/Dialogo/Dialogo.jsx'
import Placa from '../../components/Placa/Placa.jsx'
import { useSessao } from '../../contexts/SessaoContext.jsx'
import { automoveis as apiAutomoveis, pedidos as apiPedidos } from '../../services/api.js'
import { contarDiarias, formatarMoeda, hojeIso } from '../../utils/formatos.js'
import { useTituloPagina } from '../../utils/useTituloPagina.js'
import pagina from '../Pagina.module.css'
import styles from '../Pedidos.module.css'

const AVALIADOS = ['APROVADO', 'REPROVADO']

// Novo pedido em /pedidos/novo e Modificar pedido em /pedidos/:id/modificar: o mesmo formulário.
export default function NovoPedido() {
  const { id } = useParams()
  const modificando = Boolean(id)
  useTituloPagina(modificando ? `Modificar pedido #${id}` : 'Novo pedido')
  const navegar = useNavigate()
  const { usuario } = useSessao()
  // O agente modifica pela fila (US09); o cliente, por Meus pedidos
  const base = usuario?.perfil === 'CLIENTE' ? '/pedidos' : '/fila'
  const hoje = hojeIso()
  const [carros, setCarros] = useState(null)
  const [original, setOriginal] = useState(null)
  const [erroCarga, setErroCarga] = useState('')
  const [automovelId, setAutomovelId] = useState(null)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    apiAutomoveis
      .listar()
      .then(setCarros)
      .catch((falha) => setErroCarga(falha.message))
  }, [])

  useEffect(() => {
    if (!modificando) {
      return
    }
    apiPedidos
      .buscar(id)
      .then((pedido) => {
        setOriginal(pedido)
        setAutomovelId(pedido.automovel.id)
        setDataInicio(pedido.dataInicio)
        setDataFim(pedido.dataFim)
      })
      .catch((falha) => setErroCarga(falha.message))
  }, [id, modificando])

  const escolhido = carros?.find((c) => c.id === automovelId)
  const diarias = contarDiarias(dataInicio, dataFim)
  const total = escolhido && diarias > 0 ? escolhido.valorDiaria * diarias : null
  const descartaParecer = modificando && AVALIADOS.includes(original?.status)

  async function salvar() {
    setConfirmando(false)
    setErros({})
    setErroGeral('')
    setEnviando(true)
    const dados = { automovelId, dataInicio: dataInicio || null, dataFim: dataFim || null }
    try {
      const pedido = modificando
        ? await apiPedidos.modificar(id, dados)
        : await apiPedidos.criar(dados)
      const aviso = modificando ? 'Pedido modificado.' : 'Pedido enviado.'
      navegar(`${base}/${pedido.id}`, { state: { aviso } })
    } catch (falha) {
      setErros(falha.campos ?? {})
      setErroGeral(falha.message)
      setEnviando(false)
    }
  }

  function aoEnviar(evento) {
    evento.preventDefault()
    // Pedido avaliado: confirma antes, porque o parecer será descartado (DESIGN.md)
    if (descartaParecer) {
      setConfirmando(true)
    } else {
      salvar()
    }
  }

  return (
    <>
      <div className={styles.tituloLinha}>
        <div>
          <h1 className={pagina.titulo}>
            {modificando ? `Modificar pedido #${id}` : 'Novo pedido'}
          </h1>
          <p className={pagina.sub}>
            {modificando
              ? 'Troque o automóvel ou as datas. O pedido volta para a fila de análise.'
              : 'Escolha o automóvel e as datas. O valor é calculado na hora.'}
          </p>
        </div>
      </div>

      {erroCarga && (
        <div className={styles.faixaErro} role="alert">
          {erroCarga}
        </div>
      )}

      <form className={styles.formulario} onSubmit={aoEnviar} noValidate>
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

        {/* Só aparece com a lista pronta: no celular ela fica embaixo e seria empurrada quando os carros chegassem */}
        {carros && (
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
            {descartaParecer && (
              <p className={styles.alerta}>
                Este pedido já tem parecer. Ao salvar, o parecer é descartado e o pedido volta para
                análise.
              </p>
            )}
            <Aviso>{erroGeral}</Aviso>
            <Botao variante="principal" type="submit" disabled={enviando}>
              {enviando ? 'Salvando…' : modificando ? 'Salvar alterações' : 'Enviar pedido'}
            </Botao>
            {modificando && (
              <Link className={styles.linkSecundario} to={`${base}/${id}`}>
                Voltar sem alterar
              </Link>
            )}
          </aside>
        )}
      </form>

      <Dialogo
        aberto={confirmando}
        titulo="Descartar o parecer?"
        aoFechar={() => setConfirmando(false)}
      >
        <p className={styles.ajuda}>
          O pedido foi {original?.status === 'APROVADO' ? 'aprovado' : 'reprovado'}. Com a mudança,
          o parecer é apagado e um agente precisa analisar de novo.
        </p>
        <div className={styles.acoesDialogo}>
          <Botao onClick={() => setConfirmando(false)}>Manter como está</Botao>
          <Botao variante="principal" onClick={salvar}>
            Modificar mesmo assim
          </Botao>
        </div>
      </Dialogo>
    </>
  )
}

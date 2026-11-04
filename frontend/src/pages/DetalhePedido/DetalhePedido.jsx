import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import Aviso from '../../components/Aviso/Aviso.jsx'
import Botao, { BotaoLink } from '../../components/Botao/Botao.jsx'
import CaminhoPedido from '../../components/CaminhoPedido/CaminhoPedido.jsx'
import CartaoContrato from '../../components/CartaoContrato/CartaoContrato.jsx'
import Dialogo from '../../components/Dialogo/Dialogo.jsx'
import Placa from '../../components/Placa/Placa.jsx'
import SeloStatus from '../../components/SeloStatus/SeloStatus.jsx'
import Toast from '../../components/Toast/Toast.jsx'
import { pedidos as apiPedidos } from '../../services/api.js'
import { formatarData, formatarMoeda } from '../../utils/formatos.js'
import pagina from '../Pagina.module.css'
import styles from '../Pedidos.module.css'

// Responde "o que falta para este aluguel sair?": o caminho do pedido e o parecer, quando houver.
export default function DetalhePedido() {
  const { id } = useParams()
  const local = useLocation()
  const [pedido, setPedido] = useState(null)
  const [erro, setErro] = useState(null)
  const [aviso, setAviso] = useState(local.state?.aviso ?? '')
  const limparAviso = useCallback(() => setAviso(''), [])
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [erroCancelamento, setErroCancelamento] = useState('')

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      setPedido(await apiPedidos.buscar(id))
    } catch (falha) {
      setErro(falha)
    }
  }, [id])

  useEffect(() => {
    carregar()
  }, [carregar])

  // US07 e US08: modificar e cancelar só antes de contratado ou cancelado
  const alteravel = pedido && !['CONTRATADO', 'CANCELADO'].includes(pedido.status)

  async function cancelar() {
    setErroCancelamento('')
    setCancelando(true)
    try {
      setPedido(await apiPedidos.cancelar(id))
      setConfirmandoCancelamento(false)
      setAviso('Pedido cancelado.')
    } catch (falha) {
      setErroCancelamento(falha.message)
    } finally {
      setCancelando(false)
    }
  }

  const voltar = (
    <p className={styles.voltar}>
      <Link to="/pedidos">Voltar para Meus pedidos</Link>
    </p>
  )

  if (erro?.status === 404) {
    return (
      <>
        <h1 className={pagina.titulo}>Pedido não encontrado</h1>
        <p className={pagina.sub}>Ele não existe ou não é seu.</p>
        {voltar}
      </>
    )
  }

  return (
    <>
      <div className={styles.tituloLinha}>
        <div>
          <h1 className={pagina.titulo}>
            Pedido <span className={styles.id}>#{id}</span>
          </h1>
          {pedido && <p className={pagina.sub}>Enviado em {formatarData(pedido.dataCriacao)}.</p>}
        </div>
        {pedido && (
          <div className={styles.acoes}>
            <SeloStatus status={pedido.status} />
            {alteravel && (
              <>
                <BotaoLink to={`/pedidos/${id}/modificar`}>Modificar pedido</BotaoLink>
                <Botao variante="perigo" onClick={() => setConfirmandoCancelamento(true)}>
                  Cancelar pedido
                </Botao>
              </>
            )}
          </div>
        )}
      </div>

      {erro && (
        <div className={styles.faixaErro} role="alert">
          <span>{erro.message}</span>
          <Botao onClick={carregar}>Tentar de novo</Botao>
        </div>
      )}

      {!pedido && !erro && (
        <div className={styles.esqueleto} role="status" aria-label="Carregando pedido" />
      )}

      {pedido && (
        <>
          <section className={styles.cabecalhoPedido} aria-label="Automóvel e andamento">
            <Placa placa={pedido.automovel.placa} grande />
            <div>
              <h2>
                {pedido.automovel.marca} {pedido.automovel.modelo} {pedido.automovel.ano}
              </h2>
              <p className={styles.meta}>
                {formatarData(pedido.dataInicio)} a {formatarData(pedido.dataFim)} ·{' '}
                {pedido.diarias} {pedido.diarias === 1 ? 'diária' : 'diárias'} de{' '}
                {formatarMoeda(pedido.automovel.valorDiaria)}
              </p>
              <CaminhoPedido pedido={pedido} />
            </div>
          </section>

          <div className={styles.cartoesDetalhe}>
            <section className={styles.card} aria-labelledby="titulo-valor">
              <h2 id="titulo-valor">Valor do aluguel</h2>
              <p className={styles.total}>{formatarMoeda(pedido.valorTotal)}</p>
              <p className={styles.ajuda}>
                {pedido.diarias} × {formatarMoeda(pedido.automovel.valorDiaria)}
              </p>
            </section>

            <section className={`${styles.card} ${styles.largo}`} aria-labelledby="titulo-parecer">
              <h2 id="titulo-parecer">Parecer do agente</h2>
              {pedido.parecer ? (
                <dl className={styles.dados}>
                  <dt>Resultado</dt>
                  <dd>{pedido.parecer.positivo ? 'Favorável' : 'Desfavorável'}</dd>
                  <dt>Agente</dt>
                  <dd>{pedido.parecer.agente}</dd>
                  <dt>Data</dt>
                  <dd>{formatarData(pedido.parecer.data)}</dd>
                  <dt>Justificativa</dt>
                  <dd>{pedido.parecer.justificativa}</dd>
                </dl>
              ) : (
                <p className={styles.ajuda}>
                  {pedido.status === 'CANCELADO'
                    ? 'O pedido foi cancelado antes do parecer.'
                    : 'Um agente ainda vai analisar este pedido.'}
                </p>
              )}
            </section>

            {pedido.contrato && (
              <CartaoContrato contrato={pedido.contrato} className={styles.inteiro} />
            )}
          </div>
        </>
      )}

      {voltar}

      <Dialogo
        aberto={confirmandoCancelamento}
        titulo="Cancelar este pedido?"
        aoFechar={() => setConfirmandoCancelamento(false)}
      >
        <p className={styles.ajuda}>
          O pedido fica no histórico como cancelado e não pode mais ser modificado.
        </p>
        <Aviso>{erroCancelamento}</Aviso>
        <div className={styles.acoesDialogo}>
          <Botao onClick={() => setConfirmandoCancelamento(false)} disabled={cancelando}>
            Manter pedido
          </Botao>
          <Botao variante="perigoCheio" onClick={cancelar} disabled={cancelando}>
            {cancelando ? 'Cancelando…' : 'Cancelar pedido'}
          </Botao>
        </div>
      </Dialogo>

      <Toast mensagem={aviso} aoSumir={limparAviso} />
    </>
  )
}

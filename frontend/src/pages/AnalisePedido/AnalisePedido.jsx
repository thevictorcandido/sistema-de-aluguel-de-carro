import { useCallback, useEffect, useId, useState } from 'react'
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
import { useTituloPagina } from '../../utils/useTituloPagina.js'
import pagina from '../Pagina.module.css'
import styles from '../Pedidos.module.css'
import ExecutarContrato from './ExecutarContrato.jsx'

const PORCENTAGEM = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

function porcentagem(valor) {
  return `${PORCENTAGEM.format(Number(valor))}%`
}

// Formulário do parecer: resultado e justificativa obrigatória, que o cliente também vê.
function FormParecer({ pedidoId, aoRegistrar }) {
  const idJustificativa = useId()
  const [positivo, setPositivo] = useState(null)
  const [justificativa, setJustificativa] = useState('')
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    setErros({})
    setErroGeral('')
    setEnviando(true)
    try {
      aoRegistrar(await apiPedidos.registrarParecer(pedidoId, { positivo, justificativa }))
    } catch (falha) {
      setErros(falha.campos ?? {})
      setErroGeral(falha.message)
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <fieldset
        className={styles.resultado}
        aria-describedby={erros.positivo ? 'erro-resultado' : undefined}
      >
        <legend className={styles.rotuloCampo}>Resultado</legend>
        <div className={styles.opcoesParecer}>
          <label className={styles.opcaoParecer}>
            <input
              type="radio"
              name="resultado"
              checked={positivo === true}
              onChange={() => setPositivo(true)}
            />
            Favorável: o pedido segue para contrato
          </label>
          <label className={styles.opcaoParecer}>
            <input
              type="radio"
              name="resultado"
              checked={positivo === false}
              onChange={() => setPositivo(false)}
            />
            Desfavorável: o pedido é reprovado
          </label>
        </div>
        {erros.positivo && (
          <p className={styles.erroCampo} id="erro-resultado">
            {erros.positivo}
          </p>
        )}
      </fieldset>

      <label className={styles.rotuloCampo} htmlFor={idJustificativa}>
        Justificativa
      </label>
      <textarea
        id={idJustificativa}
        className={styles.texto}
        value={justificativa}
        onChange={(e) => setJustificativa(e.target.value)}
        aria-invalid={erros.justificativa ? true : undefined}
        aria-describedby={`${idJustificativa}-ajuda`}
        maxLength={1000}
      />
      <p
        className={erros.justificativa ? styles.erroCampo : styles.ajuda}
        id={`${idJustificativa}-ajuda`}
      >
        {erros.justificativa ?? 'Obrigatória. O cliente vê este texto.'}
      </p>
      <Aviso>{erroGeral}</Aviso>
      <div className={styles.rodapeParecer}>
        <Botao variante="principal" type="submit" disabled={enviando}>
          {enviando ? 'Registrando…' : 'Registrar parecer'}
        </Botao>
      </div>
    </form>
  )
}

// Responde "este cliente pode pagar?": renda comprometida em destaque, rendimentos e o parecer.
export default function AnalisePedido() {
  const { id } = useParams()
  useTituloPagina(`Análise do pedido #${id}`)
  const local = useLocation()
  const [pedido, setPedido] = useState(null)
  const [erro, setErro] = useState(null)
  const [erroAcao, setErroAcao] = useState('')
  const [aviso, setAviso] = useState(local.state?.aviso ?? '')
  const limparAviso = useCallback(() => setAviso(''), [])
  const [executando, setExecutando] = useState(false)

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

  async function iniciarAnalise() {
    setErroAcao('')
    try {
      setPedido(await apiPedidos.abrirAnalise(id))
    } catch (falha) {
      setErroAcao(falha.message)
    }
  }

  const voltar = (
    <p className={styles.voltar}>
      <Link to="/fila">Voltar para a fila</Link>
    </p>
  )

  if (erro?.status === 404) {
    return (
      <>
        <h1 className={pagina.titulo}>Pedido não encontrado</h1>
        {voltar}
      </>
    )
  }

  const ficha = pedido?.ficha
  const alteravel = pedido && !['CONTRATADO', 'CANCELADO'].includes(pedido.status)
  const largura =
    ficha?.rendaComprometida == null ? 0 : Math.min(Number(ficha.rendaComprometida), 100)

  return (
    <>
      <div className={styles.tituloLinha}>
        <div>
          <h1 className={pagina.titulo}>
            Pedido <span className={styles.id}>#{id}</span>
            {pedido && ` · ${pedido.cliente.nome}`}
          </h1>
          {ficha && (
            <p className={pagina.sub}>
              {ficha.rendaComprometida == null
                ? 'O cliente não informou rendimentos.'
                : `Aluguel de ${formatarMoeda(pedido.valorTotal)} equivale a ${porcentagem(ficha.rendaComprometida)} da renda mensal informada.`}
            </p>
          )}
        </div>
        {pedido && <SeloStatus status={pedido.status} />}
      </div>

      {erro && (
        <div className={styles.faixaErro} role="alert">
          <span>{erro.message}</span>
          <Botao onClick={carregar}>Tentar de novo</Botao>
        </div>
      )}
      <Aviso>{erroAcao}</Aviso>

      {!pedido && !erro && (
        <div className={styles.esqueleto} role="status" aria-label="Carregando pedido" />
      )}

      {pedido && ficha && (
        <>
          <section className={styles.cabecalhoAnalise} aria-label="Automóvel e andamento">
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
            {alteravel && <BotaoLink to={`/fila/${id}/modificar`}>Modificar</BotaoLink>}
          </section>

          <div className={styles.cartoesDetalhe}>
            <section className={styles.card} aria-labelledby="titulo-renda">
              <h2 id="titulo-renda">Renda comprometida</h2>
              <p className={styles.total}>
                {ficha.rendaComprometida == null ? '—' : porcentagem(ficha.rendaComprometida)}
              </p>
              <p className={styles.ajuda}>
                {formatarMoeda(pedido.valorTotal)} de {formatarMoeda(ficha.rendaMensal)} por mês
              </p>
              <div className={styles.barra} aria-hidden="true">
                <i style={{ width: `${largura}%` }} />
                <span className={styles.limite} style={{ left: `${ficha.referencia}%` }} />
              </div>
              <div className={styles.legenda}>
                <span>0%</span>
                <span>Referência {porcentagem(ficha.referencia)}</span>
                <span>100%</span>
              </div>
            </section>

            <section className={styles.card} aria-labelledby="titulo-rendimentos">
              <h2 id="titulo-rendimentos">Rendimentos</h2>
              {ficha.rendimentos.length === 0 ? (
                <p className={styles.ajuda}>Nenhum rendimento informado.</p>
              ) : (
                <table className={styles.tabelaSimples}>
                  <tbody>
                    {ficha.rendimentos.map((r) => (
                      <tr key={r.id}>
                        <td>{r.entidadeEmpregadora}</td>
                        <td className={styles.num}>{formatarMoeda(r.valor)}</td>
                      </tr>
                    ))}
                    <tr className={styles.linhaTotal}>
                      <td>Total mensal</td>
                      <td className={styles.num}>{formatarMoeda(ficha.rendaMensal)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
              <p className={styles.ajuda}>{ficha.rendimentos.length} de 3 rendimentos informados</p>
            </section>

            <section className={styles.card} aria-labelledby="titulo-cliente">
              <h2 id="titulo-cliente">Cliente</h2>
              <dl className={styles.dados}>
                <dt>CPF</dt>
                <dd className={styles.id}>{ficha.cpf}</dd>
                <dt>RG</dt>
                <dd className={styles.id}>{ficha.rg}</dd>
                <dt>Profissão</dt>
                <dd>{ficha.profissao}</dd>
                <dt>Endereço</dt>
                <dd>
                  {ficha.endereco.logradouro}, {ficha.endereco.numero}
                  {ficha.endereco.complemento && `, ${ficha.endereco.complemento}`}
                  <br />
                  {ficha.endereco.bairro}, {ficha.endereco.cidade}, {ficha.endereco.uf}
                </dd>
              </dl>
            </section>

            <section
              className={`${styles.card} ${styles.inteiro}`}
              aria-labelledby="titulo-parecer"
            >
              <h2 id="titulo-parecer">Parecer</h2>
              {pedido.status === 'ENVIADO' && (
                <div className={styles.acoes}>
                  <p className={styles.ajuda}>O pedido aguarda alguém abrir a análise.</p>
                  <Botao variante="principal" onClick={iniciarAnalise}>
                    Iniciar análise
                  </Botao>
                </div>
              )}
              {pedido.status === 'EM_ANALISE' && (
                <FormParecer
                  pedidoId={id}
                  aoRegistrar={(atualizado) => {
                    setPedido(atualizado)
                    setAviso('Parecer registrado.')
                  }}
                />
              )}
              {pedido.parecer && (
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
              )}
              {pedido.status === 'CANCELADO' && !pedido.parecer && (
                <p className={styles.ajuda}>O cliente cancelou o pedido antes do parecer.</p>
              )}
              {pedido.status === 'APROVADO' && (
                <div className={styles.rodapeParecer}>
                  <Botao variante="principal" onClick={() => setExecutando(true)}>
                    Executar contrato
                  </Botao>
                </div>
              )}
            </section>

            {pedido.contrato && (
              <CartaoContrato contrato={pedido.contrato} className={styles.inteiro} />
            )}
          </div>
        </>
      )}

      {voltar}

      <Dialogo aberto={executando} titulo="Executar contrato" aoFechar={() => setExecutando(false)}>
        {pedido && (
          <ExecutarContrato
            pedido={pedido}
            aoCancelar={() => setExecutando(false)}
            aoExecutar={async () => {
              setExecutando(false)
              await carregar()
              setAviso('Contrato executado.')
            }}
          />
        )}
      </Dialogo>

      <Toast mensagem={aviso} aoSumir={limparAviso} />
    </>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import Aviso from '../../components/Aviso/Aviso.jsx'
import Botao from '../../components/Botao/Botao.jsx'
import Placa from '../../components/Placa/Placa.jsx'
import SeloStatus, { STATUS } from '../../components/SeloStatus/SeloStatus.jsx'
import { pedidos as apiPedidos } from '../../services/api.js'
import { formatarData, formatarMoeda, formatarPeriodo, hojeIso } from '../../utils/formatos.js'
import { useTituloPagina } from '../../utils/useTituloPagina.js'
import pagina from '../Pagina.module.css'
import styles from '../Pedidos.module.css'

function diasDesde(iso, hoje = hojeIso()) {
  const dia = 24 * 60 * 60 * 1000
  return Math.max(0, Math.round((Date.parse(hoje) - Date.parse(iso.slice(0, 10))) / dia))
}

// Responde "quem está esperando parecer?": a fila abre filtrada em Aguardando análise, do mais antigo ao mais novo.
function resumo(aguardando) {
  if (aguardando.length === 0) {
    return 'Nenhum pedido aguarda análise.'
  }
  const espera = diasDesde(aguardando[0].dataCriacao)
  const quanto = espera === 0 ? 'desde hoje' : `há ${espera} ${espera === 1 ? 'dia' : 'dias'}`
  const quantos =
    aguardando.length === 1 ? '1 pedido aguarda' : `${aguardando.length} pedidos aguardam`
  return `${quantos} parecer. O mais antigo espera ${quanto}.`
}

export default function FilaPedidos() {
  useTituloPagina('Fila de pedidos')
  const navegar = useNavigate()
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [filtro, setFiltro] = useState('ENVIADO')
  const [abrindo, setAbrindo] = useState(null)

  const carregar = useCallback(async () => {
    setErro('')
    try {
      setLista(await apiPedidos.listar())
    } catch (falha) {
      setErro(falha.message)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const contagem = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(STATUS).map((s) => [s, lista?.filter((p) => p.status === s).length ?? 0]),
      ),
    [lista],
  )
  const aguardando = (lista ?? []).filter((p) => p.status === 'ENVIADO')
  const visiveis = filtro ? (lista ?? []).filter((p) => p.status === filtro) : (lista ?? [])

  // US10: analisar abre a análise (o pedido passa a Em análise) e leva para a tela do pedido
  async function analisar(id) {
    setErroAcao('')
    setAbrindo(id)
    try {
      await apiPedidos.abrirAnalise(id)
      navegar(`/fila/${id}`)
    } catch (falha) {
      setErroAcao(falha.message)
      setAbrindo(null)
      carregar()
    }
  }

  return (
    <>
      <div className={styles.tituloLinha}>
        <div>
          <h1 className={pagina.titulo}>Fila de pedidos</h1>
          {lista && <p className={pagina.sub}>{resumo(aguardando)}</p>}
        </div>
        <Botao
          variante="principal"
          disabled={aguardando.length === 0 || abrindo !== null}
          onClick={() => analisar(aguardando[0].id)}
        >
          Analisar o mais antigo
        </Botao>
      </div>

      {erro && (
        <div className={styles.faixaErro} role="alert">
          <span>{erro}</span>
          <Botao onClick={carregar}>Tentar de novo</Botao>
        </div>
      )}
      <Aviso>{erroAcao}</Aviso>

      {!lista && !erro && (
        <div className={styles.esqueleto} role="status" aria-label="Carregando a fila" />
      )}

      {lista && (
        <>
          <fieldset className={styles.contagens} aria-label="Filtrar por status">
            {Object.entries(STATUS).map(([status, { plural }]) => (
              <button
                key={status}
                type="button"
                className={styles.contagem}
                aria-pressed={filtro === status}
                onClick={() => setFiltro((atual) => (atual === status ? null : status))}
              >
                <span>{plural}</span> <b>{contagem[status]}</b>
              </button>
            ))}
          </fieldset>

          {visiveis.length === 0 ? (
            <div className={styles.vazio}>
              <p>
                {filtro
                  ? `Nenhum pedido com o status ${STATUS[filtro].rotulo.toLowerCase()}.`
                  : 'Nenhum pedido no sistema ainda.'}
              </p>
              {filtro && <Botao onClick={() => setFiltro(null)}>Ver todos</Botao>}
            </div>
          ) : (
            <>
              <div className={styles.tabela}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Pedido</th>
                      <th scope="col">Automóvel</th>
                      <th scope="col">Cliente</th>
                      <th scope="col">Período</th>
                      <th scope="col" className={styles.num}>
                        Valor
                      </th>
                      <th scope="col">Enviado em</th>
                      <th scope="col">Status</th>
                      <th scope="col">
                        <span className={styles.somenteLeitor}>Ação</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.map((pedido) => (
                      <tr key={pedido.id}>
                        <td className={styles.id}>
                          <Link to={`/fila/${pedido.id}`}>#{pedido.id}</Link>
                        </td>
                        <td>
                          <span className={styles.carro}>
                            <Placa placa={pedido.automovel.placa} />
                            {pedido.automovel.modelo} {pedido.automovel.ano}
                          </span>
                        </td>
                        <td>{pedido.cliente.nome}</td>
                        <td>{formatarPeriodo(pedido.dataInicio, pedido.dataFim)}</td>
                        <td className={styles.num}>{formatarMoeda(pedido.valorTotal)}</td>
                        <td>{formatarData(pedido.dataCriacao)}</td>
                        <td>
                          <SeloStatus status={pedido.status} />
                        </td>
                        <td>
                          {pedido.status === 'ENVIADO' ? (
                            <Botao
                              onClick={() => analisar(pedido.id)}
                              disabled={abrindo !== null}
                              aria-label={`Analisar pedido ${pedido.id}`}
                            >
                              {abrindo === pedido.id ? 'Abrindo…' : 'Analisar'}
                            </Botao>
                          ) : (
                            <Link to={`/fila/${pedido.id}`}>Ver</Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className={styles.cartoes}>
                {visiveis.map((pedido) => (
                  <li key={pedido.id}>
                    <Link to={`/fila/${pedido.id}`} className={styles.cartao}>
                      <span className={styles.cartaoLinha}>
                        <span className={styles.carro}>
                          <Placa placa={pedido.automovel.placa} />
                          {pedido.cliente.nome}
                        </span>
                        <SeloStatus status={pedido.status} />
                      </span>
                      <span className={styles.cartaoLinha}>
                        <span>{formatarPeriodo(pedido.dataInicio, pedido.dataFim)}</span>
                        <span>{formatarMoeda(pedido.valorTotal)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </>
  )
}

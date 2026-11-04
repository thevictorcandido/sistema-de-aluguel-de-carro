import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import Botao, { BotaoLink } from '../../components/Botao/Botao.jsx'
import Placa from '../../components/Placa/Placa.jsx'
import SeloStatus, { STATUS } from '../../components/SeloStatus/SeloStatus.jsx'
import { pedidos as apiPedidos } from '../../services/api.js'
import { formatarData, formatarMoeda, formatarPeriodo } from '../../utils/formatos.js'
import pagina from '../Pagina.module.css'
import styles from '../Pedidos.module.css'

// Frase do título: responde "em que pé estão meus pedidos?" antes da tabela.
function resumo(lista) {
  if (lista.length === 0) {
    return 'Você ainda não fez nenhum pedido.'
  }
  const aguardando = lista.filter((p) => p.status === 'ENVIADO' || p.status === 'EM_ANALISE').length
  const total = lista.length === 1 ? '1 pedido' : `${lista.length} pedidos`
  if (aguardando === 0) {
    return `${total}, nenhum aguardando análise.`
  }
  return `${total}, ${aguardando} ${aguardando === 1 ? 'aguarda' : 'aguardam'} análise ou parecer.`
}

export default function MeusPedidos() {
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState(null)

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
  const visiveis = filtro ? (lista ?? []).filter((p) => p.status === filtro) : (lista ?? [])

  return (
    <>
      <div className={styles.tituloLinha}>
        <div>
          <h1 className={pagina.titulo}>Meus pedidos</h1>
          {lista && <p className={pagina.sub}>{resumo(lista)}</p>}
        </div>
        <BotaoLink variante="principal" to="/pedidos/novo">
          Novo pedido
        </BotaoLink>
      </div>

      {erro && (
        <div className={styles.faixaErro} role="alert">
          <span>{erro}</span>
          <Botao onClick={carregar}>Tentar de novo</Botao>
        </div>
      )}

      {!lista && !erro && (
        <div className={styles.esqueleto} role="status" aria-label="Carregando pedidos" />
      )}

      {lista && lista.length === 0 && (
        <div className={styles.vazio}>
          <p>Escolha um automóvel e as datas para fazer o primeiro pedido.</p>
        </div>
      )}

      {lista && lista.length > 0 && (
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
              <p>Nenhum pedido com o status {STATUS[filtro].rotulo.toLowerCase()}.</p>
              <Botao onClick={() => setFiltro(null)}>Ver todos</Botao>
            </div>
          ) : (
            <>
              <div className={styles.tabela}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Pedido</th>
                      <th scope="col">Automóvel</th>
                      <th scope="col">Período</th>
                      <th scope="col" className={styles.num}>
                        Valor
                      </th>
                      <th scope="col">Enviado em</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.map((pedido) => (
                      <tr key={pedido.id}>
                        <td className={styles.id}>
                          <Link to={`/pedidos/${pedido.id}`}>#{pedido.id}</Link>
                        </td>
                        <td>
                          <span className={styles.carro}>
                            <Placa placa={pedido.automovel.placa} />
                            {pedido.automovel.modelo} {pedido.automovel.ano}
                          </span>
                        </td>
                        <td>{formatarPeriodo(pedido.dataInicio, pedido.dataFim)}</td>
                        <td className={styles.num}>{formatarMoeda(pedido.valorTotal)}</td>
                        <td>{formatarData(pedido.dataCriacao)}</td>
                        <td>
                          <SeloStatus status={pedido.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className={styles.cartoes}>
                {visiveis.map((pedido) => (
                  <li key={pedido.id}>
                    <Link to={`/pedidos/${pedido.id}`} className={styles.cartao}>
                      <span className={styles.cartaoLinha}>
                        <span className={styles.carro}>
                          <Placa placa={pedido.automovel.placa} />
                          {pedido.automovel.modelo}
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

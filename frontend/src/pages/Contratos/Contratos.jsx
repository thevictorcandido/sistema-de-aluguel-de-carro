import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import Botao from '../../components/Botao/Botao.jsx'
import { TIPO_CONTRATO } from '../../components/CartaoContrato/CartaoContrato.jsx'
import Placa from '../../components/Placa/Placa.jsx'
import { useSessao } from '../../contexts/SessaoContext.jsx'
import { contratos as apiContratos } from '../../services/api.js'
import { formatarData, formatarMoeda } from '../../utils/formatos.js'
import { useTituloPagina } from '../../utils/useTituloPagina.js'
import pagina from '../Pagina.module.css'
import styles from '../Pedidos.module.css'

// Contratos executados por todos os agentes, do mais novo ao mais antigo, com o crédito quando houver.
export default function Contratos() {
  const { usuario } = useSessao()
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState('')
  const titulo = usuario.perfil === 'BANCO' ? 'Contratos e créditos' : 'Contratos'
  useTituloPagina(titulo)

  const carregar = useCallback(async () => {
    setErro('')
    try {
      setLista(await apiContratos.listar())
    } catch (falha) {
      setErro(falha.message)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const comCredito = lista?.filter((c) => c.credito).length ?? 0

  return (
    <>
      <div className={styles.tituloLinha}>
        <div>
          <h1 className={pagina.titulo}>{titulo}</h1>
          {lista && (
            <p className={pagina.sub}>
              {lista.length === 0
                ? 'Nenhum contrato executado ainda.'
                : `${lista.length} ${lista.length === 1 ? 'contrato' : 'contratos'}, ${comCredito} com crédito bancário.`}
            </p>
          )}
        </div>
      </div>

      {erro && (
        <div className={styles.faixaErro} role="alert">
          <span>{erro}</span>
          <Botao onClick={carregar}>Tentar de novo</Botao>
        </div>
      )}

      {!lista && !erro && (
        <div className={styles.esqueleto} role="status" aria-label="Carregando contratos" />
      )}

      {lista && lista.length === 0 && (
        <div className={styles.vazio}>
          <p>Os contratos aparecem aqui quando um pedido aprovado é contratado.</p>
          <Link to="/fila">Ir para a fila de pedidos</Link>
        </div>
      )}

      {lista && lista.length > 0 && (
        <div className={`${styles.tabela} ${styles.tabelaVisivel}`}>
          <table>
            <thead>
              <tr>
                <th scope="col">Pedido</th>
                <th scope="col">Automóvel</th>
                <th scope="col">Cliente</th>
                <th scope="col">Proprietário</th>
                <th scope="col">Executado por</th>
                <th scope="col">Assinatura</th>
                <th scope="col" className={styles.num}>
                  Aluguel
                </th>
                <th scope="col">Crédito</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((contrato) => (
                <tr key={contrato.id}>
                  <td className={styles.id}>
                    <Link to={`/fila/${contrato.pedidoId}`}>#{contrato.pedidoId}</Link>
                  </td>
                  <td>
                    <span className={styles.carro}>
                      <Placa placa={contrato.placa} />
                      {contrato.automovel.split(' ').slice(1).join(' ')}
                    </span>
                  </td>
                  <td>{contrato.cliente}</td>
                  <td title={TIPO_CONTRATO[contrato.tipo]}>{contrato.proprietario}</td>
                  <td>{contrato.executadoPor}</td>
                  <td>{formatarData(contrato.dataAssinatura)}</td>
                  <td className={styles.num}>{formatarMoeda(contrato.valorAluguel)}</td>
                  <td>
                    {contrato.credito
                      ? `${formatarMoeda(contrato.credito.valor)} em ${contrato.credito.parcelas}x`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

import { useCallback, useEffect, useState } from 'react'
import Botao from '../../components/Botao/Botao.jsx'
import Toast from '../../components/Toast/Toast.jsx'
import { clientes } from '../../services/api.js'
import { useTituloPagina } from '../../utils/useTituloPagina.js'
import pagina from '../Pagina.module.css'
import DadosCadastrais from './DadosCadastrais.jsx'
import ExcluirConta from './ExcluirConta.jsx'
import styles from './MeusDados.module.css'
import Rendimentos from './Rendimentos.jsx'

export default function MeusDados() {
  useTituloPagina('Meus dados')
  const [cliente, setCliente] = useState(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const limparAviso = useCallback(() => setAviso(''), [])

  const carregar = useCallback(async () => {
    setErro('')
    try {
      setCliente(await clientes.meusDados())
    } catch (falha) {
      setErro(falha.message)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Depois de mexer nos rendimentos, recarrega para atualizar a renda e a regra de exclusão.
  const aoMudarRendimentos = useCallback(
    async (mensagem) => {
      await carregar()
      setAviso(mensagem)
    },
    [carregar],
  )

  return (
    <>
      <header className={styles.cabecalho}>
        <h1 className={pagina.titulo}>Meus dados</h1>
        <p className={pagina.sub}>Mantenha o cadastro certo para a análise dos seus pedidos.</p>
      </header>

      {erro && (
        <div className={styles.faixaErro} role="alert">
          <span>{erro}</span>
          <Botao onClick={carregar}>Tentar de novo</Botao>
        </div>
      )}

      {!cliente && !erro && (
        <div className={styles.esqueleto} role="status" aria-label="Carregando seus dados" />
      )}

      {cliente && (
        <>
          <DadosCadastrais
            cliente={cliente}
            aoSalvar={(atualizado) => {
              setCliente(atualizado)
              setAviso('Dados salvos.')
            }}
          />
          <Rendimentos cliente={cliente} aoMudar={aoMudarRendimentos} />
          <ExcluirConta exclusao={cliente.exclusao} />
        </>
      )}

      <Toast mensagem={aviso} aoSumir={limparAviso} />
    </>
  )
}

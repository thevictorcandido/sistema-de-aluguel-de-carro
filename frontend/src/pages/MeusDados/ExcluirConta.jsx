import { useState } from 'react'
import { useNavigate } from 'react-router'
import Aviso from '../../components/Aviso/Aviso.jsx'
import Botao from '../../components/Botao/Botao.jsx'
import Dialogo from '../../components/Dialogo/Dialogo.jsx'
import { useSessao } from '../../contexts/SessaoContext.jsx'
import { clientes } from '../../services/api.js'
import styles from './MeusDados.module.css'
import Secao from './Secao.jsx'

export default function ExcluirConta({ exclusao }) {
  const { sair } = useSessao()
  const navegar = useNavigate()
  const [confirmando, setConfirmando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState('')

  async function excluir() {
    setErro('')
    setExcluindo(true)
    try {
      await clientes.excluirConta()
      await sair()
      navegar('/entrar', { replace: true })
    } catch (falha) {
      setErro(falha.message)
      setExcluindo(false)
    }
  }

  return (
    <Secao
      titulo="Excluir conta"
      descricao="Apaga seu cadastro e seus rendimentos. Não dá para desfazer."
    >
      {exclusao.permitida ? (
        <p className={styles.motivo}>Pedidos cancelados ou reprovados são apagados junto.</p>
      ) : (
        <p className={styles.motivo} id="motivo-exclusao">
          {exclusao.motivo}
        </p>
      )}
      <div className={styles.acoes}>
        <Botao
          variante="perigo"
          disabled={!exclusao.permitida}
          aria-describedby={exclusao.permitida ? undefined : 'motivo-exclusao'}
          onClick={() => setConfirmando(true)}
        >
          Excluir conta
        </Botao>
      </div>

      <Dialogo
        aberto={confirmando}
        titulo="Excluir sua conta?"
        aoFechar={() => setConfirmando(false)}
      >
        <p className={styles.textoDialogo}>
          Seu cadastro e seus rendimentos serão apagados, e você sairá do sistema.
        </p>
        <Aviso>{erro}</Aviso>
        <div className={`${styles.acoes} ${styles.acoesDialogo}`}>
          <Botao onClick={() => setConfirmando(false)} disabled={excluindo}>
            Manter conta
          </Botao>
          <Botao variante="perigoCheio" onClick={excluir} disabled={excluindo}>
            {excluindo ? 'Excluindo…' : 'Excluir conta'}
          </Botao>
        </div>
      </Dialogo>
    </Secao>
  )
}

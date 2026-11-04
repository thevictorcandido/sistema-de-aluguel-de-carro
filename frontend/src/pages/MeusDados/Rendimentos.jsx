import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import Aviso from '../../components/Aviso/Aviso.jsx'
import Botao from '../../components/Botao/Botao.jsx'
import Campo from '../../components/Campo/Campo.jsx'
import { clientes } from '../../services/api.js'
import { formatarMoeda, lerMoeda, moedaParaCampo } from '../../utils/formatos.js'
import styles from './MeusDados.module.css'
import Secao from './Secao.jsx'

const VAZIO = { entidadeEmpregadora: '', valor: '' }

// Formulário de um rendimento, usado para adicionar e para editar uma linha.
function FormRendimento({ inicial = VAZIO, rotuloEnviar, aoEnviar, aoCancelar }) {
  const [dados, setDados] = useState(inicial)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    const valor = lerMoeda(dados.valor)
    if (dados.valor.trim() && valor === null) {
      setErros({ valor: 'Use só números, como 4.200,50.' })
      return
    }
    setErros({})
    setErroGeral('')
    setEnviando(true)
    try {
      await aoEnviar({ entidadeEmpregadora: dados.entidadeEmpregadora, valor })
      setDados(VAZIO)
    } catch (erro) {
      setErros(erro.campos ?? {})
      setErroGeral(Object.keys(erro.campos ?? {}).length ? '' : erro.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className={styles.formRendimento} onSubmit={enviar} noValidate>
      <div className={styles.edicao}>
        <Campo
          rotulo="Empregador"
          name="entidadeEmpregadora"
          value={dados.entidadeEmpregadora}
          onChange={(e) => setDados((d) => ({ ...d, entidadeEmpregadora: e.target.value }))}
          erro={erros.entidadeEmpregadora}
        />
        <Campo
          rotulo="Valor mensal (R$)"
          name="valor"
          inputMode="decimal"
          value={dados.valor}
          onChange={(e) => setDados((d) => ({ ...d, valor: e.target.value }))}
          erro={erros.valor}
        />
      </div>
      <Aviso>{erroGeral}</Aviso>
      <div className={styles.acoes}>
        {aoCancelar && <Botao onClick={aoCancelar}>Cancelar</Botao>}
        <Botao type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : rotuloEnviar}
        </Botao>
      </div>
    </form>
  )
}

export default function Rendimentos({ cliente, aoMudar }) {
  const [editando, setEditando] = useState(null)
  const [erroRemocao, setErroRemocao] = useState('')
  const { rendimentos, maximoRendimentos, rendaMensal } = cliente
  const cabeMais = rendimentos.length < maximoRendimentos

  async function remover(rendimento) {
    setErroRemocao('')
    try {
      await clientes.removerRendimento(rendimento.id)
      await aoMudar(`Rendimento de ${rendimento.entidadeEmpregadora} removido.`)
    } catch (erro) {
      setErroRemocao(erro.message)
    }
  }

  return (
    <Secao
      titulo="Rendimentos"
      descricao="Empregadores e valores mensais usados na análise financeira. Até 3 registros."
    >
      {rendimentos.length === 0 ? (
        <p className={styles.vazio}>Você ainda não informou nenhum rendimento.</p>
      ) : (
        <ul className={styles.lista}>
          {rendimentos.map((rendimento) => (
            <li key={rendimento.id} className={styles.item}>
              {editando === rendimento.id ? (
                <FormRendimento
                  inicial={{
                    entidadeEmpregadora: rendimento.entidadeEmpregadora,
                    valor: moedaParaCampo(rendimento.valor),
                  }}
                  rotuloEnviar="Salvar rendimento"
                  aoCancelar={() => setEditando(null)}
                  aoEnviar={async (dados) => {
                    await clientes.atualizarRendimento(rendimento.id, dados)
                    setEditando(null)
                    await aoMudar('Rendimento atualizado.')
                  }}
                />
              ) : (
                <>
                  <span className={styles.empregador}>{rendimento.entidadeEmpregadora}</span>
                  <span className={styles.valor}>{formatarMoeda(rendimento.valor)}</span>
                  <button
                    type="button"
                    className={styles.icone}
                    onClick={() => setEditando(rendimento.id)}
                    aria-label={`Editar rendimento de ${rendimento.entidadeEmpregadora}`}
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.icone}
                    onClick={() => remover(rendimento)}
                    aria-label={`Remover rendimento de ${rendimento.entidadeEmpregadora}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className={styles.total}>
        <span>Renda mensal</span>
        <span>{formatarMoeda(rendaMensal)}</span>
      </p>
      <p className={styles.contagem}>
        {rendimentos.length} de {maximoRendimentos} rendimentos informados
      </p>
      <Aviso>{erroRemocao}</Aviso>

      {cabeMais && editando === null && (
        <FormRendimento
          rotuloEnviar="Adicionar rendimento"
          aoEnviar={async (dados) => {
            await clientes.adicionarRendimento(dados)
            await aoMudar('Rendimento adicionado.')
          }}
        />
      )}
    </Secao>
  )
}

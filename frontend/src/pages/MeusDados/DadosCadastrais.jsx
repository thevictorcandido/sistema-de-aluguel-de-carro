import { useState } from 'react'
import Aviso from '../../components/Aviso/Aviso.jsx'
import Botao from '../../components/Botao/Botao.jsx'
import Campo from '../../components/Campo/Campo.jsx'
import { clientes } from '../../services/api.js'
import { mascaraCep, mascaraCpf, UFS } from '../../utils/formatos.js'
import styles from './MeusDados.module.css'
import Secao from './Secao.jsx'

const CAMPOS_ENDERECO = ['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf']

function paraFormulario(cliente) {
  return {
    nome: cliente.nome,
    cpf: cliente.cpf,
    rg: cliente.rg,
    profissao: cliente.profissao,
    ...Object.fromEntries(CAMPOS_ENDERECO.map((nome) => [nome, cliente.endereco[nome] ?? ''])),
  }
}

function paraApi(dados) {
  return {
    nome: dados.nome,
    cpf: dados.cpf,
    rg: dados.rg,
    profissao: dados.profissao,
    endereco: Object.fromEntries(CAMPOS_ENDERECO.map((nome) => [nome, dados[nome]])),
  }
}

// Dados pessoais e endereço: duas seções do mesmo formulário, salvas juntas pelo único botão principal.
export default function DadosCadastrais({ cliente, aoSalvar }) {
  const [dados, setDados] = useState(() => paraFormulario(cliente))
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [salvando, setSalvando] = useState(false)

  function campo(nome, mascara) {
    return {
      name: nome,
      value: dados[nome],
      erro: erros[nome],
      onChange: (e) => {
        const valor = mascara ? mascara(e.target.value) : e.target.value
        setDados((atual) => ({ ...atual, [nome]: valor }))
      },
    }
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErros({})
    setErroGeral('')
    setSalvando(true)
    try {
      const atualizado = await clientes.atualizar(paraApi(dados))
      setDados(paraFormulario(atualizado))
      aoSalvar(atualizado)
    } catch (erro) {
      setErros(
        Object.fromEntries(
          Object.entries(erro.campos ?? {}).map(([chave, msg]) => [
            chave.replace(/^endereco\./, ''),
            msg,
          ]),
        ),
      )
      setErroGeral(erro.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} noValidate>
      <Secao titulo="Dados pessoais" descricao="Aparecem para o agente que analisa seus pedidos.">
        <Campo rotulo="Nome completo" autoComplete="name" {...campo('nome')} />
        <div className={styles.par}>
          <Campo rotulo="CPF" inputMode="numeric" {...campo('cpf', mascaraCpf)} />
          <Campo rotulo="RG" {...campo('rg')} />
        </div>
        <Campo rotulo="Profissão" {...campo('profissao')} />
        <p className={styles.motivo}>
          Usuário de acesso: <b>{cliente.login}</b>
        </p>
      </Secao>

      <Secao titulo="Endereço" descricao="Endereço residencial do contratante.">
        <div className={styles.par}>
          <Campo rotulo="CEP" inputMode="numeric" {...campo('cep', mascaraCep)} />
          <Campo rotulo="Bairro" {...campo('bairro')} />
        </div>
        <Campo rotulo="Rua" {...campo('logradouro')} />
        <div className={styles.par}>
          <Campo rotulo="Número" {...campo('numero')} />
          <Campo rotulo="Complemento" {...campo('complemento')} />
        </div>
        <div className={styles.parEstreito}>
          <Campo rotulo="Cidade" {...campo('cidade')} />
          <Campo rotulo="Estado" opcoes={UFS} {...campo('uf')} />
        </div>
      </Secao>

      <div className={styles.rodapeForm}>
        <Aviso>{erroGeral}</Aviso>
        <Botao variante="principal" type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar alterações'}
        </Botao>
      </div>
    </form>
  )
}

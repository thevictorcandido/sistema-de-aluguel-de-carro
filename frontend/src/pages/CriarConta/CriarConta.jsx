import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import Aviso from '../../components/Aviso/Aviso.jsx'
import Botao from '../../components/Botao/Botao.jsx'
import Campo from '../../components/Campo/Campo.jsx'
import Marca from '../../components/Marca/Marca.jsx'
import { useSessao } from '../../contexts/SessaoContext.jsx'
import { inicioDoPerfil } from '../../routes/menu.js'
import { clientes } from '../../services/api.js'
import { mascaraCep, mascaraCpf, UFS } from '../../utils/formatos.js'
import { useTituloPagina } from '../../utils/useTituloPagina.js'
import styles from '../Entrar/Acesso.module.css'

const VAZIO = {
  login: '',
  senha: '',
  nome: '',
  cpf: '',
  rg: '',
  profissao: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
}

const CAMPOS_ENDERECO = ['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf']

// A API devolve os erros do endereço como "endereco.cep"; o formulário usa só "cep".
function errosPorCampo(campos = {}) {
  return Object.fromEntries(
    Object.entries(campos).map(([chave, mensagem]) => [chave.replace(/^endereco\./, ''), mensagem]),
  )
}

export default function CriarConta() {
  useTituloPagina('Criar conta')
  const { usuario, carregando, entrar } = useSessao()
  const [dados, setDados] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!carregando && usuario) {
    return <Navigate to={inicioDoPerfil(usuario.perfil)} replace />
  }

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

  async function aoEnviar(evento) {
    evento.preventDefault()
    setErros({})
    setErroGeral('')
    setEnviando(true)
    const endereco = Object.fromEntries(CAMPOS_ENDERECO.map((nome) => [nome, dados[nome]]))
    try {
      await clientes.cadastrar({
        login: dados.login,
        senha: dados.senha,
        nome: dados.nome,
        cpf: dados.cpf,
        rg: dados.rg,
        profissao: dados.profissao,
        endereco,
      })
      // Com a sessão preenchida, o redirecionamento acima leva para Meus pedidos
      await entrar(dados.login, dados.senha)
    } catch (erro) {
      const porCampo = errosPorCampo(erro.campos)
      setErros(porCampo)
      setErroGeral(erro.message)
      setEnviando(false)
    }
  }

  return (
    <main className={styles.pagina}>
      <section className={styles.folha} aria-labelledby="titulo-criar-conta">
        <Marca />
        <h1 id="titulo-criar-conta" className={styles.titulo}>
          Criar conta
        </h1>
        <p className={styles.sub}>Os rendimentos ficam para depois, em Meus dados.</p>

        <form className={styles.formulario} onSubmit={aoEnviar} noValidate>
          <fieldset className={styles.bloco}>
            <legend className={styles.legenda}>Acesso</legend>
            <Campo rotulo="Usuário" autoComplete="username" {...campo('login')} />
            <Campo
              rotulo="Senha"
              type="password"
              autoComplete="new-password"
              ajuda="Use 8 caracteres ou mais."
              {...campo('senha')}
            />
          </fieldset>

          <fieldset className={styles.bloco}>
            <legend className={styles.legenda}>Dados pessoais</legend>
            <Campo rotulo="Nome completo" autoComplete="name" {...campo('nome')} />
            <div className={styles.par}>
              <Campo
                rotulo="CPF"
                inputMode="numeric"
                placeholder="000.000.000-00"
                {...campo('cpf', mascaraCpf)}
              />
              <Campo rotulo="RG" {...campo('rg')} />
            </div>
            <Campo rotulo="Profissão" autoComplete="organization-title" {...campo('profissao')} />
          </fieldset>

          <fieldset className={styles.bloco}>
            <legend className={styles.legenda}>Endereço</legend>
            <Campo
              rotulo="CEP"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              {...campo('cep', mascaraCep)}
            />
            <Campo rotulo="Rua" autoComplete="address-line1" {...campo('logradouro')} />
            <div className={styles.par}>
              <Campo rotulo="Número" {...campo('numero')} />
              <Campo rotulo="Complemento" autoComplete="address-line2" {...campo('complemento')} />
            </div>
            <Campo rotulo="Bairro" {...campo('bairro')} />
            <div className={styles.parEstreito}>
              <Campo rotulo="Cidade" autoComplete="address-level2" {...campo('cidade')} />
              <Campo rotulo="Estado" opcoes={UFS} {...campo('uf')} />
            </div>
          </fieldset>

          <Aviso>{erroGeral}</Aviso>
          <Botao variante="principal" type="submit" className={styles.acao} disabled={enviando}>
            {enviando ? 'Criando conta…' : 'Criar conta'}
          </Botao>
        </form>

        <p className={styles.rodape}>
          Já tem conta? <Link to="/entrar">Entrar</Link>
        </p>
      </section>
    </main>
  )
}

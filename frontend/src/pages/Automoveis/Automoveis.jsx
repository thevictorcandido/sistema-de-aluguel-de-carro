import { Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Aviso from '../../components/Aviso/Aviso.jsx'
import Botao from '../../components/Botao/Botao.jsx'
import Campo from '../../components/Campo/Campo.jsx'
import Dialogo from '../../components/Dialogo/Dialogo.jsx'
import Placa from '../../components/Placa/Placa.jsx'
import Toast from '../../components/Toast/Toast.jsx'
import { useSessao } from '../../contexts/SessaoContext.jsx'
import { automoveis as apiAutomoveis } from '../../services/api.js'
import { formatarMoeda, lerMoeda, moedaParaCampo } from '../../utils/formatos.js'
import { useTituloPagina } from '../../utils/useTituloPagina.js'
import pagina from '../Pagina.module.css'
import styles from '../Pedidos.module.css'

const VAZIO = { placa: '', matricula: '', marca: '', modelo: '', ano: '', valorDiaria: '' }

function paraFormulario(carro) {
  return {
    placa: carro.placa,
    matricula: carro.matricula,
    marca: carro.marca,
    modelo: carro.modelo,
    ano: String(carro.ano),
    valorDiaria: moedaParaCampo(carro.valorDiaria),
  }
}

// Cadastro e edição no mesmo diálogo (DESIGN.md). Quem cadastra fica proprietário (US13).
function FormAutomovel({ carro, aoSalvar, aoCancelar }) {
  const [dados, setDados] = useState(carro ? paraFormulario(carro) : VAZIO)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  function campo(nome) {
    return {
      name: nome,
      value: dados[nome],
      erro: erros[nome],
      onChange: (e) => setDados((d) => ({ ...d, [nome]: e.target.value })),
    }
  }

  async function enviar(evento) {
    evento.preventDefault()
    const valorDiaria = lerMoeda(dados.valorDiaria)
    if (dados.valorDiaria.trim() && valorDiaria === null) {
      setErros({ valorDiaria: 'Use só números, como 180,00.' })
      return
    }
    setErros({})
    setErroGeral('')
    setEnviando(true)
    const corpo = {
      ...dados,
      placa: dados.placa.trim().toUpperCase(),
      ano: dados.ano ? Number(dados.ano) : null,
      valorDiaria,
    }
    try {
      const salvo = carro
        ? await apiAutomoveis.atualizar(carro.id, corpo)
        : await apiAutomoveis.cadastrar(corpo)
      aoSalvar(salvo)
    } catch (falha) {
      setErros(falha.campos ?? {})
      setErroGeral(falha.message)
      setEnviando(false)
    }
  }

  return (
    <form className={styles.formAutomovel} onSubmit={enviar} noValidate>
      <div className={styles.parCredito}>
        <Campo
          rotulo="Placa"
          placeholder="ABC1D23"
          autoCapitalize="characters"
          {...campo('placa')}
        />
        <Campo rotulo="Matrícula" {...campo('matricula')} />
      </div>
      <div className={styles.parCredito}>
        <Campo rotulo="Marca" {...campo('marca')} />
        <Campo rotulo="Modelo" {...campo('modelo')} />
      </div>
      <div className={styles.parCredito}>
        <Campo rotulo="Ano" type="number" min={1990} max={2100} {...campo('ano')} />
        <Campo rotulo="Diária (R$)" inputMode="decimal" {...campo('valorDiaria')} />
      </div>
      <Aviso>{erroGeral}</Aviso>
      <div className={styles.acoesDialogo}>
        <Botao onClick={aoCancelar} disabled={enviando}>
          Cancelar
        </Botao>
        <Botao variante="principal" type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : carro ? 'Salvar automóvel' : 'Cadastrar automóvel'}
        </Botao>
      </div>
    </form>
  )
}

// Responde "quais carros estão disponíveis?": todos os automóveis, com o proprietário de cada um.
export default function Automoveis() {
  useTituloPagina('Automóveis')
  const { usuario } = useSessao()
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState('')
  const [editando, setEditando] = useState(null)
  const [excluindo, setExcluindo] = useState(null)
  const [erroExclusao, setErroExclusao] = useState('')
  const [aviso, setAviso] = useState('')
  const limparAviso = useCallback(() => setAviso(''), [])

  const carregar = useCallback(async () => {
    setErro('')
    try {
      setLista(await apiAutomoveis.listar())
    } catch (falha) {
      setErro(falha.message)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const meus = lista?.filter((c) => c.proprietarioId === usuario.id).length ?? 0

  async function excluir() {
    setErroExclusao('')
    try {
      await apiAutomoveis.excluir(excluindo.id)
      setExcluindo(null)
      setAviso('Automóvel excluído.')
      carregar()
    } catch (falha) {
      setErroExclusao(falha.message)
    }
  }

  return (
    <>
      <div className={styles.tituloLinha}>
        <div>
          <h1 className={pagina.titulo}>Automóveis</h1>
          {lista && (
            <p className={pagina.sub}>
              {lista.length} {lista.length === 1 ? 'automóvel' : 'automóveis'}, {meus} em nome de{' '}
              {usuario.nome}.
            </p>
          )}
        </div>
        <Botao variante="principal" onClick={() => setEditando('novo')}>
          Cadastrar automóvel
        </Botao>
      </div>

      {erro && (
        <div className={styles.faixaErro} role="alert">
          <span>{erro}</span>
          <Botao onClick={carregar}>Tentar de novo</Botao>
        </div>
      )}

      {!lista && !erro && (
        <div className={styles.esqueleto} role="status" aria-label="Carregando automóveis" />
      )}

      {lista && (
        <div className={`${styles.tabela} ${styles.tabelaVisivel} ${styles.comAcoes}`}>
          <table>
            <thead>
              <tr>
                <th scope="col">Placa</th>
                <th scope="col">Matrícula</th>
                <th scope="col">Automóvel</th>
                <th scope="col" className={styles.num}>
                  Ano
                </th>
                <th scope="col" className={styles.num}>
                  Diária
                </th>
                <th scope="col">Proprietário</th>
                <th scope="col">
                  <span className={styles.somenteLeitor}>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lista.map((carro) => {
                const meu = carro.proprietarioId === usuario.id
                return (
                  <tr key={carro.id}>
                    <td>
                      <Placa placa={carro.placa} />
                    </td>
                    <td className={styles.id}>{carro.matricula}</td>
                    <td>
                      {carro.marca} {carro.modelo}
                    </td>
                    <td className={styles.num}>{carro.ano}</td>
                    <td className={styles.num}>{formatarMoeda(carro.valorDiaria)}</td>
                    <td>{carro.proprietario}</td>
                    <td>
                      {meu && (
                        <span className={styles.acoesLinha}>
                          <button
                            type="button"
                            className={styles.icone}
                            onClick={() => setEditando(carro)}
                            aria-label={`Editar ${carro.placa}`}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={styles.icone}
                            onClick={() => {
                              setErroExclusao('')
                              setExcluindo(carro)
                            }}
                            aria-label={`Excluir ${carro.placa}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialogo
        aberto={editando !== null}
        titulo={editando === 'novo' ? 'Cadastrar automóvel' : `Editar ${editando?.placa ?? ''}`}
        aoFechar={() => setEditando(null)}
      >
        {editando !== null && (
          <FormAutomovel
            carro={editando === 'novo' ? null : editando}
            aoCancelar={() => setEditando(null)}
            aoSalvar={(salvo) => {
              setAviso(
                editando === 'novo' ? `Automóvel ${salvo.placa} cadastrado.` : 'Automóvel salvo.',
              )
              setEditando(null)
              carregar()
            }}
          />
        )}
      </Dialogo>

      <Dialogo
        aberto={excluindo !== null}
        titulo={`Excluir ${excluindo?.placa ?? ''}?`}
        aoFechar={() => setExcluindo(null)}
      >
        <p className={styles.ajuda}>
          O automóvel sai da lista. Se ele já aparece em algum pedido, o sistema recusa.
        </p>
        <Aviso>{erroExclusao}</Aviso>
        <div className={styles.acoesDialogo}>
          <Botao onClick={() => setExcluindo(null)}>Manter</Botao>
          <Botao variante="perigoCheio" onClick={excluir}>
            Excluir
          </Botao>
        </div>
      </Dialogo>

      <Toast mensagem={aviso} aoSumir={limparAviso} />
    </>
  )
}

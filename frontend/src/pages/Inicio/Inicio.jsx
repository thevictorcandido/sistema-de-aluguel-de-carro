import { useEffect, useState } from 'react'
import Marca from '../../components/Marca/Marca.jsx'
import { verificarApi } from '../../services/api.js'
import styles from './Inicio.module.css'

const MENSAGENS = {
  verificando: 'Verificando a conexão com a API…',
  ok: 'API conectada.',
  erro: 'A API não respondeu. Confira se o backend está rodando na porta 8080.',
}

export default function Inicio() {
  const [situacao, setSituacao] = useState('verificando')

  useEffect(() => {
    let ativo = true
    verificarApi()
      .then(() => ativo && setSituacao('ok'))
      .catch(() => ativo && setSituacao('erro'))
    return () => {
      ativo = false
    }
  }, [])

  return (
    <main className={styles.pagina}>
      <section className={styles.folha}>
        <Marca />
        <h1 className={styles.titulo}>Sistema em construção</h1>
        <p className={styles.texto}>
          Clientes pedem o aluguel de um automóvel, e empresas e bancos avaliam e contratam.
        </p>
        <p className={styles[situacao]} role="status">
          {MENSAGENS[situacao]}
        </p>
      </section>
    </main>
  )
}

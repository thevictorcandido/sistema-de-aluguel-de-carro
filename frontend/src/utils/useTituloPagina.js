import { useEffect } from 'react'

// Título da aba do navegador por tela, para quem alterna abas ou usa leitor de tela.
export function useTituloPagina(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Aluguel de Carros` : 'Aluguel de Carros'
  }, [titulo])
}

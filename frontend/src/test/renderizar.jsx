import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Rotas } from '../App.jsx'
import { SessaoProvider } from '../contexts/SessaoContext.jsx'

// Monta o app inteiro numa rota inicial, como o navegador faria.
export function renderizarEm(caminho) {
  return render(
    <MemoryRouter initialEntries={[caminho]}>
      <SessaoProvider>
        <Rotas />
      </SessaoProvider>
    </MemoryRouter>,
  )
}

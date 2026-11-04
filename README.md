# Sistema de Aluguel de Carros

> [!NOTE]
> Sistema web para clientes pedirem o aluguel de automóveis e para agentes, empresas e bancos, avaliarem esses pedidos e executarem os contratos.

Laboratório 02 da disciplina Desenvolvimento e Integração de Aplicações Web (DIAW), com o Prof. Dr. João Paulo Carneiro Aramuni.

---

## 🚧 Status do Projeto

[![CI](https://img.shields.io/github/actions/workflow/status/thevictorcandido/sistema-de-aluguel-de-carro/ci.yml?branch=main&label=CI)](https://github.com/thevictorcandido/sistema-de-aluguel-de-carro/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-25-007ec6?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0.9-007ec6?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19.3-007ec6?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.3-007ec6?logo=vite&logoColor=white)

Em construção. O andamento de cada tarefa está nas [issues](https://github.com/thevictorcandido/sistema-de-aluguel-de-carro/issues) e no [plano de construção](docs/PLANO.md).

---

## 📚 Índice

- [Links Úteis](#-links-úteis)
- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Arquitetura](#-arquitetura)
- [Instalação e Execução](#-instalação-e-execução)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Testes](#-testes)
- [Documentações utilizadas](#-documentações-utilizadas)
- [Autores](#-autores)

---

## 🔗 Links Úteis

- 📐 **Modelagem UML:** [docs/uml](docs/uml/README.md), com todas as versões dos diagramas.
- 📄 **Especificação técnica:** [docs/SPEC.md](docs/SPEC.md).
- 🎨 **Direção visual:** [DESIGN.md](DESIGN.md).
- 🗂️ **Plano de construção:** [docs/PLANO.md](docs/PLANO.md).

O sistema roda só localmente; não há demonstração online.

---

## 📝 Sobre o Projeto

O sistema permite efetuar, cancelar e modificar pedidos de aluguel de automóveis pela internet. Clientes individuais se cadastram e enviam pedidos. Agentes, que são empresas e bancos aderentes, avaliam cada pedido do ponto de vista financeiro e, com parecer positivo, executam o contrato. Um banco pode ainda associar um contrato de crédito ao aluguel.

O automóvel pode ficar registrado como propriedade do cliente, da empresa ou do banco, conforme o tipo do contrato.

---

## ✨ Funcionalidades Principais

- 🔐 **Cadastro e login** de clientes e agentes, com acesso bloqueado a quem não estiver logado.
- 👤 **Dados do cliente:** RG, CPF, nome, endereço, profissão e até 3 rendimentos.
- 📝 **Pedidos de aluguel:** criar, consultar, modificar e cancelar, acompanhando o status.
- 📊 **Análise financeira:** o agente vê os rendimentos do cliente e registra um parecer.
- 📑 **Contratos:** execução do contrato e registro do proprietário do automóvel.
- 🏦 **Crédito bancário:** contrato de crédito opcional, concedido por um banco.
- 🚗 **Automóveis:** matrícula, ano, marca, modelo, placa e valor da diária.

---

## 🛠 Tecnologias Utilizadas

### 💻 Front-end

- **Biblioteca:** React 19
- **Linguagem:** JavaScript (ES2022+)
- **Estilização:** CSS Modules com os tokens do [DESIGN.md](DESIGN.md)
- **Rotas:** React Router
- **Ícones:** Lucide
- **Build Tool:** Vite 8
- **Qualidade:** Biome e Vitest com Testing Library

### 🖥️ Back-end

- **Linguagem:** Java 25 (JDK)
- **Framework:** Spring Boot 4.0.9, em arquitetura MVC
- **Banco de Dados:** Supabase (PostgreSQL); H2 no perfil local
- **ORM e migrações:** Spring Data JPA (Hibernate) e Flyway
- **Autenticação:** Spring Security com JWT em cookie `HttpOnly`
- **Build:** Apache Maven, pelo Maven Wrapper

### ⚙️ Infraestrutura & DevOps

- **CI:** GitHub Actions, com testes do back-end, lint, testes e build do front-end em cada PR

---

## 🏗 Arquitetura

O sistema segue o MVC com dois subsistemas, como pede o enunciado:

- **Construção dinâmica das páginas web** (`frontend/`): o React faz o papel de View e consome a API em JSON.
- **Gestão de pedidos e contratos** (`backend/`): `controller` é o Controller; `service`, `repository` e `model` formam o Model.

Durante o desenvolvimento, o Vite repassa as chamadas a `/api` para o Spring Boot. Front e API ficam na mesma origem, sem necessidade de CORS.

| Diagrama de Pacotes | Diagrama de Classes |
| :---: | :---: |
| <img src="docs/uml/v1/pacotes.svg" alt="Diagrama de pacotes" width="380px"> | <img src="docs/uml/v2/classes.svg" alt="Diagrama de classes" width="380px"> |

Detalhes das camadas, rotas da API e regras de negócio em [docs/SPEC.md](docs/SPEC.md).

---

## 🔧 Instalação e Execução

### Pré-requisitos

- **Java JDK 25**
- **Node.js 24** ou superior, com npm
- Maven não precisa estar instalado: o projeto usa o Maven Wrapper (`mvnw`).

### 🔑 Variáveis de Ambiente

#### 1 Back-end (Spring Boot)

Sem nenhuma variável, a API sobe no perfil `local`, com banco H2 em memória. Para usar o Supabase, copie `backend/.env.example` para `backend/.env` e preencha:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Perfil de banco | `supabase` |
| `DB_URL` | JDBC do Session pooler do Supabase | `jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require` |
| `DB_USER` | Usuário do banco | `postgres.abcdefghijkl` |
| `DB_PASSWORD` | Senha do banco | — |
| `JWT_SECRET` | Chave de assinatura do token, 32 caracteres ou mais | — |

O arquivo `.env` não vai para o git.

#### 2 Front-end (React, Vite)

Não há variáveis: o front chama `/api`, e o Vite repassa para `http://localhost:8080`.

### 📦 Instalação de Dependências

```bash
git clone https://github.com/thevictorcandido/sistema-de-aluguel-de-carro.git
cd sistema-de-aluguel-de-carro
```

```bash
cd frontend
npm install
```

O back-end baixa as dependências na primeira execução do `mvnw`.

### 💾 Inicialização do Banco de Dados

As tabelas e os dados iniciais são criados pelo Flyway quando a API sobe, tanto no H2 quanto no Supabase, a partir de `backend/src/main/resources/db/migration`. Nenhum passo manual é necessário.

Usuários de teste, todos com a senha `senha123` e dados fictícios:

| Login | Perfil | Nome |
| :--- | :--- | :--- |
| `marina` | Cliente | Marina Costa |
| `joao` | Cliente | João Ferreira |
| `rotasul` | Empresa | Locadora Rota Sul |
| `vialeste` | Empresa | Locadora Via Leste |
| `horizonte` | Banco | Banco Horizonte |
| `confianca` | Banco | Banco Confiança |

### ⚡ Como Executar a Aplicação

#### Terminal 1: Back-end (Spring Boot)

```bash
cd backend
./mvnw spring-boot:run
```

No Windows, use `mvnw.cmd spring-boot:run`. A API fica em **http://localhost:8080**.

#### Terminal 2: Front-end (React, Vite)

```bash
cd frontend
npm run dev
```

O front-end fica em **http://127.0.0.1:5173**. Se a porta 5173 estiver ocupada, o Vite para com um aviso em vez de subir em outra porta.

---

## 📂 Estrutura de Pastas

```text
.
├── backend/                 # API Spring Boot
│   ├── src/main/java/br/com/aluguelcarros/
│   │   ├── controller/      # Rotas REST
│   │   ├── exception/       # Erros de regra de negócio
│   │   ├── model/           # Entidades JPA e enums
│   │   ├── repository/      # Spring Data JPA
│   │   └── security/        # Configuração do Spring Security
│   └── src/main/resources/  # Perfis e migrações do Flyway
├── frontend/                # React + Vite
│   └── src/
│       ├── components/      # Componentes reutilizáveis
│       ├── pages/           # Uma pasta por tela
│       ├── services/        # Cliente HTTP da API
│       └── styles/          # Tokens e estilos base
├── docs/
│   ├── uml/                 # Diagramas, uma pasta por versão
│   ├── SPEC.md              # Especificação técnica
│   └── PLANO.md             # Plano de construção
└── DESIGN.md                # Direção visual
```

---

## 🧪 Testes

### Back-end

```bash
cd backend
./mvnw verify
```

JUnit 5 e MockMvc, com o banco H2. Cobrem todas as transições do ciclo do pedido, o limite de 3 rendimentos e as migrações com os dados iniciais.

### Front-end

```bash
cd frontend
npm test
npm run lint
```

Vitest com Testing Library, e Biome para formatação e lint. Os testes ponta a ponta com Playwright entram na tarefa 11 do plano.

---

## 🔗 Documentações utilizadas

- [Spring Boot](https://docs.spring.io/spring-boot/index.html)
- [Spring Security](https://docs.spring.io/spring-security/reference/index.html)
- [Flyway](https://documentation.red-gate.com/flyway)
- [React](https://react.dev/)
- [Vite](https://vite.dev/guide/)
- [Supabase: conexão com o banco](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [PlantUML](https://plantuml.com/)

---

## 👥 Autores

| Nome | GitHub |
| :--- | :--- |
| Victor Cândido Leite | [@thevictorcandido](https://github.com/thevictorcandido) |

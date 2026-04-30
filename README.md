# JhefDammys

Sistema interno para organizar clientes, orcamentos, eventos, custos, estoque e lucro.

## O que e este projeto

O JhefDammys esta sendo construido para resolver um problema bem real de operacao: hoje boa parte do atendimento e do controle do negocio acontece entre Instagram, WhatsApp, anotacoes no papel e memoria.

A ideia do sistema e juntar tudo isso em um lugar so e facilitar principalmente:

- agenda de eventos
- cadastro de clientes
- criacao de orcamentos
- controle de custos
- acompanhamento do lucro
- estoque e compras

Nesta primeira fase, o foco esta totalmente na parte interna do negocio. A area publica para cliente, consulta de datas e contrato automatico fica para depois.

## Objetivo da primeira versao

O objetivo desta versao inicial e simples:

- parar de depender de papel e memoria
- organizar melhor os pedidos
- saber quanto foi gasto em cada evento
- entender o lucro real de cada servico
- reduzir confusao com datas e agenda

## Tecnologias usadas

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

### Backend

- NestJS
- TypeScript
- Prisma
- PostgreSQL

## Estrutura do projeto

```text
JhefDammys/
  frontend/
  backend/
  docs/
```

- `frontend`: interface administrativa
- `backend`: API e regras de negocio
- `docs`: documentos auxiliares do projeto

## O que ja esta funcionando

Hoje o projeto ja tem uma base funcional para:

- dashboard administrativa
- fluxo de clientes
- base inicial do fluxo de orcamentos
- banco PostgreSQL configurado
- migrations com Prisma

### Clientes

Ja esta funcionando:

- cadastro de cliente
- listagem de clientes
- busca de clientes
- detalhes basicos do cliente
- integracao real entre frontend, backend e banco

### Orcamentos

Ja existe a base para:

- criar orcamento
- listar orcamentos
- buscar orcamentos
- relacionar o orcamento com um cliente

## Como rodar o projeto

### 1. Clonar o repositorio

```bash
git clone https://github.com/lucca-almeida/jhef-dammys.git
cd jhef-dammys
```

### 2. Instalar as dependencias

#### Frontend

```bash
cd frontend
npm.cmd install
```

#### Backend

```bash
cd ../backend
npm.cmd install
```

### 3. Configurar os arquivos de ambiente

#### Frontend

Existe um exemplo em:

- [frontend/.env.example](frontend/.env.example)

Crie um arquivo `.env.local` dentro de `frontend` com:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

#### Backend

Existe um exemplo em:

- [backend/.env.example](backend/.env.example)

Crie um arquivo `.env` dentro de `backend` com base nele:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/churrasco_manager?schema=public"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### 4. Banco de dados

O projeto usa PostgreSQL local.

Voce precisa ter:

- PostgreSQL instalado
- servico rodando na porta `5432`
- usuario `postgres`
- uma senha compativel com a configuracao do `.env`

Se o banco `churrasco_manager` ainda nao existir, ele pode ser criado manualmente no PostgreSQL antes de rodar as migrations.

### 5. Rodar as migrations

Dentro da pasta `backend`:

```bash
npm.cmd run prisma:generate
npm.cmd run prisma:migrate -- --name init
```

### 6. Rodar o backend

Dentro da pasta `backend`:

```bash
npm.cmd run start:dev
```

Por padrao a API sobe em:

`http://localhost:3001/api`

Se o modo watch do Nest der problema no Windows, voce pode usar:

```bash
npm.cmd run build
npm.cmd run start:prod
```

### 7. Rodar o frontend

Dentro da pasta `frontend`:

```bash
npm.cmd run dev
```

Por padrao a interface sobe em:

`http://localhost:3000`

## Comandos uteis

### Backend

```bash
npm.cmd run build
npm.cmd run start:dev
npm.cmd run start:prod
npm.cmd run prisma:generate
npm.cmd run prisma:migrate -- --name nome-da-migration
npm.cmd run test
```

### Frontend

```bash
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
```

## Testes

### Backend

O backend ja vem preparado com Jest.

Hoje:

- a base de testes existe
- ainda faltam testes reais das regras de negocio

### Frontend

O frontend ainda nao tem testes automatizados implementados.

Mais para frente, a ideia e adicionar:

- testes de componente
- e depois testes de fluxo com Playwright

## Rotas que ja podem ser abertas

Com frontend e backend rodando, ja da para acessar:

- `http://localhost:3000/dashboard`
- `http://localhost:3000/clientes`
- `http://localhost:3000/orcamentos`
- `http://localhost:3000/agenda`
- `http://localhost:3000/eventos`
- `http://localhost:3000/estoque`
- `http://localhost:3000/custos`
- `http://localhost:3000/financeiro`

## Proximos passos

- completar o fluxo de orcamentos
- adicionar servicos e itens do cardapio
- relacionar itens aos orcamentos
- transformar orcamento aprovado em evento
- montar agenda real dos eventos
- expandir custos, estoque e financeiro
- adicionar testes automatizados

## Sobre o GitHub

Uma melhoria boa agora e preencher a descricao do repositorio no GitHub, porque isso nao vem do README automaticamente.

Sugestao de descricao curta:

`Sistema interno para gestao de eventos, orcamentos, clientes, custos e lucro.`

## Fechando

Este projeto esta sendo construido com foco em estrutura, clareza e evolucao gradual. A ideia nao e apenas fazer telas, mas montar uma base de sistema que possa realmente virar ferramenta de trabalho e, ao mesmo tempo, servir como projeto serio de desenvolvimento.

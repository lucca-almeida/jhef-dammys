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
- fluxo de servicos
- fluxo de orcamentos com itens
- fluxo inicial de eventos
- agenda mensal puxando os eventos reais
- fluxo inicial de pagamentos e financeiro
- fluxo inicial de custos por evento
- base de produtos e ficha tecnica
- dashboard puxando dados reais de eventos, orcamentos, pagamentos, custos e produtos
- banco PostgreSQL configurado
- migrations com Prisma

### Clientes

Ja esta funcionando:

- cadastro de cliente
- listagem de clientes
- busca de clientes
- detalhes basicos do cliente
- integracao real entre frontend, backend e banco
- edicao rapida do cliente selecionado
- atalho para abrir orcamento com o cliente ja preselecionado

### Orcamentos

Ja esta funcionando:

- criar orcamento
- editar orcamento ja salvo sem precisar remontar do zero
- listar orcamentos
- buscar orcamentos
- relacionar o orcamento com um cliente
- adicionar itens do cardapio ao orcamento
- transformar o orcamento em evento direto pela lista
- abrir o evento certo direto a partir do orcamento quando ele ja foi fechado
- calcular custo estimado para servico completo quando existir ficha tecnica
- mostrar a composicao de ingredientes no custo estimado
- aplicar extra operacional e margem para sugerir o valor do orcamento

### Servicos

Ja esta funcionando:

- cadastro de servicos
- listagem de servicos
- ativar e desativar servicos
- edicao rapida do servico selecionado
- ficha tecnica por servico
- custo estimado por pessoa

### Produtos

Ja esta funcionando:

- cadastro de ingredientes e insumos
- custo atual por produto
- unidade de medida
- estoque minimo e estoque atual
- base para alimentar a ficha tecnica
- edicao rapida para atualizar preco e estoque conforme o mercado muda

### Eventos

Ja esta funcionando:

- listagem de eventos
- conversao de orcamento em evento
- copia dos itens do orcamento para o evento
- atualizacao inicial de status do evento
- painel com cardapio, pagamentos, custos e resultado por evento
- atalhos para abrir financeiro e custos com o evento ja selecionado

### Agenda

Ja esta funcionando:

- calendario mensal com navegacao entre meses
- destaque visual de datas ocupadas
- selecao de dia para ver os eventos agendados
- leitura da agenda real a partir da API de eventos
- atalho para abrir o evento certo direto da agenda

### Financeiro

Ja esta funcionando:

- registro de pagamentos por evento
- controle de tipo e forma de pagamento
- visao de valor fechado, recebido e saldo restante
- leitura dos custos lancados para mostrar resultado atual
- lucro projetado por evento com base no que ja foi lancado
- painel financeiro inicial com ultimos recebimentos

### Custos

Ja esta funcionando:

- registro de custos por evento
- categorias rapidas para o operacional
- historico de gastos com busca
- visao inicial do peso dos custos na operacao

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
npm.cmd run prisma:migrate -- --name nome-da-migration
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
- `http://localhost:3000/servicos`
- `http://localhost:3000/orcamentos`
- `http://localhost:3000/agenda`
- `http://localhost:3000/eventos`
- `http://localhost:3000/financeiro`
- `http://localhost:3000/produtos`
- `http://localhost:3000/estoque`
- `http://localhost:3000/custos`

## Proximos passos

- revisar o fluxo de orcamentos para uso diario
- refinar a experiencia de envio e acompanhamento do orcamento
- levar o resultado financeiro tambem para uma visao mais resumida no evento
- ligar melhor dashboard, agenda, eventos e financeiro
- melhorar ainda mais a experiencia de produtos e ficha tecnica
- deixar clientes e servicos tambem mais faceis de editar no dia a dia
- preparar o sistema para uso interno continuo
- adicionar testes automatizados

## Sobre o GitHub

Uma melhoria boa agora e preencher a descricao do repositorio no GitHub, porque isso nao vem do README automaticamente.

Sugestao de descricao curta:

`Sistema interno para gestao de eventos, orcamentos, clientes, custos e lucro.`

## Fechando

Este projeto esta sendo construido com foco em estrutura, clareza e evolucao gradual. A ideia nao e apenas fazer telas, mas montar uma base de sistema que possa realmente virar ferramenta de trabalho e, ao mesmo tempo, servir como projeto serio de desenvolvimento.

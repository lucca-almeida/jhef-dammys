# JhefDammys

Sistema interno para gestao de eventos, clientes, orcamentos, custos, estoque e lucro.

## Sobre o projeto

O JhefDammys nasceu para organizar a operacao de um negocio de eventos e buffet que hoje depende muito de conversas no Instagram, WhatsApp, anotacoes no papel e calculos feitos manualmente.

A ideia do sistema e centralizar o que mais pesa no dia a dia:

- agenda de eventos
- cadastro de clientes
- criacao de orcamentos
- controle de custos
- acompanhamento do lucro
- estoque e compras

O foco da primeira fase e resolver a operacao interna. A parte publica para clientes, consulta de datas e contrato automatico fica para uma etapa futura.

## Objetivo da primeira versao

Esta primeira versao do projeto foi pensada para:

- parar de depender de papel e memoria
- organizar os pedidos em um fluxo mais claro
- saber quanto realmente foi gasto em cada evento
- entender o lucro real de cada servico
- evitar confusao com datas e agenda

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

- `frontend`: interface administrativa do sistema
- `backend`: API e regras de negocio
- `docs`: documentos auxiliares do projeto

## Funcionalidades ja iniciadas

Atualmente o projeto ja tem uma base funcional para:

- dashboard administrativa
- modulo de clientes
- modulo inicial de orcamentos
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

## Status atual

O projeto esta em desenvolvimento.

Hoje a base tecnica esta pronta e os primeiros fluxos reais ja comecaram a funcionar. O foco agora e evoluir o modulo de orcamentos, depois servicos/cardapio, eventos e agenda.

## Como rodar o projeto

### 1. Backend

Entre na pasta:

```bash
cd backend
```

Instale as dependencias:

```bash
npm.cmd install
```

Rode a API:

```bash
npm.cmd run start:dev
```

Por padrao ela sobe em:

`http://localhost:3001/api`

### 2. Frontend

Em outro terminal:

```bash
cd frontend
```

Instale as dependencias:

```bash
npm.cmd install
```

Rode a aplicacao:

```bash
npm.cmd run dev
```

Por padrao ela sobe em:

`http://localhost:3000`

## Banco de dados

O projeto usa PostgreSQL local.

A configuracao principal esta no arquivo:

- [backend/.env](backend/.env)

E o schema principal esta em:

- [backend/prisma/schema.prisma](backend/prisma/schema.prisma)

Para aplicar as migrations:

```bash
cd backend
npm.cmd run prisma:migrate -- --name nome-da-migration
```

Para regenerar o client do Prisma:

```bash
npm.cmd run prisma:generate
```

## Proximos passos planejados

- completar o fluxo de orcamentos
- adicionar servicos e itens do cardapio
- relacionar itens aos orcamentos
- transformar orcamento aprovado em evento
- montar agenda real dos eventos
- expandir custos, estoque e financeiro

## Observacao final

Este projeto esta sendo construido com foco em estrutura, clareza e evolucao gradual. A ideia nao e apenas "fazer telas", mas criar uma base de sistema que realmente possa virar uma ferramenta de trabalho e, ao mesmo tempo, servir como projeto serio de desenvolvimento.

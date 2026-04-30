# JhefDammys Backend

Backend do sistema interno JhefDammys.

## Objetivo

Esta API sera responsavel por:

- autenticacao
- regras de negocio
- cadastro de clientes
- orcamentos
- eventos
- pagamentos
- custos
- controle de estoque

## Stack

- NestJS
- TypeScript
- Prisma
- PostgreSQL

## Rodando em desenvolvimento

```bash
npm.cmd run start:dev
```

Por padrao a API sobe em `http://localhost:3001`.

## Banco de dados

O schema principal esta em:

`prisma/schema.prisma`

Para gerar o client do Prisma:

```bash
npm.cmd run prisma:generate
```

Para rodar migrations:

```bash
npm.cmd run prisma:migrate
```

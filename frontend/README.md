# JhefDammys Frontend

Frontend do sistema interno JhefDammys.

## Objetivo

Esta aplicacao sera a interface administrativa do sistema, com foco em:

- dashboard operacional
- agenda de eventos
- clientes
- orcamentos
- custos
- estoque
- financeiro

## Stack

- Next.js
- TypeScript
- Tailwind CSS

## Rodando em desenvolvimento

```bash
npm.cmd run dev
```

Abra `http://localhost:3000`.

## Variaveis de ambiente

Crie um arquivo `.env.local` se precisar sobrescrever a URL da API:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Estrutura principal

```text
src/
  app/
  components/
  lib/
```

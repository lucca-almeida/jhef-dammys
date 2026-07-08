# Deploy PWA do JhefDammys

Este guia foi pensado para colocar o sistema no ar de um jeito simples e rapido, para testar no celular usando link e "adicionar a tela inicial".

## Caminho recomendado

- frontend no Vercel
- backend no Render
- banco PostgreSQL no Render

Essa combinacao costuma ser pratica porque:

- o frontend com Next.js sobe muito bem no Vercel
- o backend Node/NestJS sobe bem no Render
- o banco Postgres fica no mesmo ecossistema do backend
- no final voce ganha um link publico para abrir no celular

## 1. Subir o backend no Render

Crie um novo Web Service apontando para o repositorio.

Se quiser reduzir a parte manual, voce tambem pode usar o arquivo:

- [render.yaml](../render.yaml)

Use estes valores:

- Root Directory: `backend`
- Build Command: `npm install && npm run deploy:build`
- Start Command: `npm run deploy:start`

Variaveis de ambiente:

- `DATABASE_URL`
- `PORT=3001`
- `FRONTEND_URL=https://SEU-FRONTEND.vercel.app`
- `AUTH_SECRET`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Depois que subir, teste:

- `https://SEU-BACKEND.onrender.com/api/health`

Se devolver `status: ok`, a API esta viva.

Observacao:

- se usar o `render.yaml`, o banco e o backend podem nascer juntos no Render
- mesmo assim, `FRONTEND_URL` e `ADMIN_PASSWORD` ainda pedem ajuste manual no painel

## 2. Criar o banco Postgres no Render

Crie um banco PostgreSQL no mesmo painel.

Depois copie a `External Database URL` para a variavel `DATABASE_URL` do backend.

Observacao:

- em banco novo, o `prisma migrate deploy` do start deve criar a estrutura automaticamente

## 3. Subir o frontend no Vercel

Importe o mesmo repositorio no Vercel.

Use estes valores:

- Root Directory: `frontend`

Variavel de ambiente:

- `NEXT_PUBLIC_API_URL=https://SEU-BACKEND.onrender.com/api`

Framework:

- Next.js

Quando o deploy terminar, o Vercel vai gerar um link publico.

## 4. Testar no celular

1. Abra o link do frontend no celular
2. Faça login
3. Abra dashboard, clientes, orcamentos, eventos e estoque
4. No navegador do celular, toque em "Adicionar a tela inicial"

## 4.1 Login inicial de teste

No primeiro deploy, use o que voce definiu no backend:

- email: valor de `ADMIN_EMAIL`
- senha: valor de `ADMIN_PASSWORD`

## 5. O que revisar no primeiro teste

- se o login abre rapido
- se a navegacao esta confortavel no celular
- se o estoque salva entrada, saida e ajuste
- se o orcamento continua calculando normalmente
- se o backend responde sem erro de CORS

## 6. Se quiser deixar ainda mais pronto

Depois do primeiro link funcionando, o proximo passo natural e:

- colocar dominio proprio
- ajustar nome e icone final do app
- revisar mensagens e atalhos do uso diario

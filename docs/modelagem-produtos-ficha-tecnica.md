# Modelagem de Produtos e Ficha Tecnica

## Objetivo

Essa parte do sistema vai permitir que o orcamento fique mais inteligente.

Hoje o projeto ja entende:

- clientes
- servicos
- orcamentos
- eventos

O proximo passo e fazer o sistema entender:

- quais produtos ele compra
- quanto cada produto custa
- quais produtos entram em cada prato ou servico
- quanto custa produzir cada item vendido

Com isso, quando ele montar um orcamento com um servico como `arroz carreteiro`, o sistema vai conseguir estimar o custo com base nos ingredientes cadastrados.

---

## Ideia central

Vamos separar bem 3 conceitos:

### 1. Produto

Produto e o insumo que ele compra ou usa no dia a dia.

Exemplos:

- arroz
- carne
- alho
- cebola
- oleo
- carvao
- gas
- maionese

### 2. Servico

Servico e o que ele vende para o cliente.

Exemplos:

- arroz carreteiro
- feijoada
- churrasco
- torresmo
- baiao de dois
- buffet de saladas

### 3. Ficha tecnica

Ficha tecnica e a ligacao entre o servico e os produtos usados para fazer esse servico.

Exemplo:

`Arroz carreteiro` usa:

- arroz
- carne
- cebola
- alho
- oleo

---

## Como fica a modelagem

## Tabela `products`

Essa tabela guarda os ingredientes e insumos.

### Campos sugeridos

- `id`
- `name`
- `description`
- `category`
- `unit`
- `currentCost`
- `averageCost`
- `stockQuantity`
- `minimumStock`
- `isActive`
- `createdAt`
- `updatedAt`

### Explicando os campos

- `name`: nome do produto, como arroz ou carne
- `description`: observacao opcional
- `category`: ajuda a organizar, como graos, carnes, temperos, descartaveis
- `unit`: unidade usada no controle, como `kg`, `l`, `un`, `pacote`
- `currentCost`: ultimo custo conhecido
- `averageCost`: custo medio
- `stockQuantity`: quantidade em estoque
- `minimumStock`: quantidade minima para alerta
- `isActive`: se ainda esta em uso

---

## Tabela `service_recipe_items`

Essa e a ficha tecnica do servico.

Ela liga:

- `service`
- `product`

### Campos sugeridos

- `id`
- `serviceId`
- `productId`
- `quantityPerPerson`
- `fixedQuantity`
- `wasteFactor`
- `notes`
- `createdAt`
- `updatedAt`

### Explicando os campos

- `serviceId`: qual prato ou servico esta sendo montado
- `productId`: qual ingrediente entra nele
- `quantityPerPerson`: quanto desse produto vai por pessoa
- `fixedQuantity`: quantidade fixa se existir
- `wasteFactor`: margem de perda opcional
- `notes`: observacoes, como "usar corte especial" ou "considerar mesa completa"

### Regra principal

Para esse projeto, a melhor logica inicial e trabalhar com `quantityPerPerson`.

Exemplo:

Para `arroz carreteiro`:

- arroz: `0.16 kg` por pessoa
- carne: `0.12 kg` por pessoa
- cebola: `0.03 kg` por pessoa

Se o evento for para `100 pessoas`, o sistema calcula:

- arroz: `16 kg`
- carne: `12 kg`
- cebola: `3 kg`

---

## Tabela `purchase_items`

Essa tabela ja faz parte da evolucao natural de compras, mas aqui ela ganha ainda mais importancia.

Ela ajuda a atualizar o custo real dos produtos.

### Campos sugeridos

- `id`
- `purchaseId`
- `productId`
- `quantity`
- `unitPrice`
- `totalPrice`

### Papel dela no sistema

Toda vez que uma compra for registrada:

- o produto pode ter o `currentCost` atualizado
- o `averageCost` pode ser recalculado

Assim o orcamento usa um custo mais proximo da realidade.

---

## Relacao entre as tabelas

### `products`

Guarda os ingredientes e insumos.

### `services`

Guarda o que ele vende.

### `service_recipe_items`

Diz quais produtos entram em cada servico.

### `purchase_items`

Atualiza o custo dos produtos ao longo do tempo.

---

## Fluxo esperado no sistema

### Cadastro

1. Ele cadastra os produtos.
2. Ele cadastra os servicos.
3. Ele monta a ficha tecnica de cada servico.

### Compra

1. Ele registra a compra de arroz, carne, alho e outros itens.
2. O sistema atualiza o custo atual dos produtos.

### Orcamento

1. Ele escolhe um servico, por exemplo `arroz carreteiro`.
2. Informa a quantidade de pessoas.
3. O sistema consulta a ficha tecnica.
4. Calcula quanto de cada produto sera necessario.
5. Multiplica pelo custo atual dos produtos.
6. Gera o custo estimado do servico.

### Resultado

O sistema consegue mostrar:

- custo estimado dos ingredientes
- custo total estimado do servico
- valor de venda sugerido
- margem prevista

---

## Exemplo real

### Produto

- arroz
- unidade: `kg`
- custo atual: `6.50`

- carne
- unidade: `kg`
- custo atual: `28.00`

### Servico

- arroz carreteiro

### Ficha tecnica

- arroz: `0.16 kg por pessoa`
- carne: `0.12 kg por pessoa`

### Orcamento

- 100 pessoas

### Calculo

- arroz: `16 kg x 6.50 = 104.00`
- carne: `12 kg x 28.00 = 336.00`

O sistema vai somando os demais ingredientes e chega no custo estimado do prato.

---

## O que muda no schema atual

Hoje o projeto ja tem:

- `Service`
- `Budget`
- `BudgetItem`
- `Event`

Vamos adicionar depois:

- `Product`
- `ServiceRecipeItem`

Opcionalmente, numa segunda leva:

- `ProductCategory` se quisermos separar melhor
- `StockMovement` mais detalhado
- `Purchase` e `PurchaseItem` mais completos

---

## Ordem ideal para implementar

Para nao baguncar o projeto, a melhor ordem e:

1. criar `Product`
2. criar tela e API de produtos
3. criar `ServiceRecipeItem`
4. criar tela de ficha tecnica por servico
5. integrar o calculo no orcamento

---

## Decisao recomendada

Minha recomendacao para a primeira versao dessa inteligencia e:

- usar `quantityPerPerson`
- usar `currentCost` como base do calculo
- manter a margem e o preco final ainda editaveis

Assim o sistema ajuda muito, mas nao prende ele a uma conta totalmente automatica.

---

## Resumo

Com essa modelagem, o sistema deixa de ser apenas organizador e passa a ajudar de verdade na precificacao.

O ganho real sera:

- orcamento mais preciso
- menos chute no valor
- mais clareza de custo
- base melhor para calcular lucro depois

# AGENTS.md

## Arquitetura atual: Next.js

O projeto deve funcionar como um site Next.js hospedável na Vercel, com App Router e API routes para operações sensíveis com o Notion.

Regras atuais:

- A interface deve ser Next.js + React + TypeScript + TailwindCSS.
- O navegador não pode chamar o Notion SDK diretamente.
- O token do Notion pode ser salvo no `localStorage`, conforme decisão do usuário, mas nunca deve aparecer em logs ou na tela sem máscara.
- O frontend deve conversar com o Notion somente por API routes em `/api`.
- A leitura do CSV acontece no frontend usando o `File` selecionado pelo usuário e PapaParse.
- A importação, teste de conexão, busca de databases, detecção de propriedades e leitura/criação de relações do Notion acontecem em API routes do Next.
- O app não deve depender de Electron para abrir janela, menu, IPC, `preload` ou `contextBridge`.
- O app não deve depender de Vite, Express ou servidor Node separado para rodar em produção.
- Não usar automação visual do Notion; usar apenas a API oficial.

Rotas HTTP esperadas:

```txt
POST /api/notion/databases
POST /api/notion/test-connection
POST /api/notion/properties-summary
POST /api/notion/property-options
POST /api/notion/import-transactions
```

As configurações são salvas pelo frontend em `localStorage` na chave `ficsvnotion.settings` e enviadas no corpo das chamadas `/api` quando necessário.

Resposta padrão da API:

```ts
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };
```

## Descoberta de databases do Notion

O app deve permitir que o usuário busque as databases disponíveis no Notion pela API oficial e escolha uma delas pela interface, em vez de depender apenas de digitar manualmente o `databaseId`.

Essa funcionalidade deve seguir as mesmas regras de segurança do restante do projeto:

- O React não pode chamar o Notion SDK diretamente.
- A busca deve acontecer em API route do Next.js.
- A comunicação deve passar por `/api/notion/databases`.
- O token do Notion deve ser mascarado na UI.
- O token do Notion não deve aparecer em logs.
- Apenas databases compartilhadas com a integração do Notion aparecerão na listagem.

## Endpoint adicional

Adicionar o endpoint:

```txt
POST /api/notion/databases
```

Responsabilidade:

- Receber o token salvo no `localStorage` pelo corpo da requisição.
- Criar o client do Notion SDK na API route.
- Buscar databases acessíveis ao token.
- Retornar para o frontend apenas dados seguros para exibição.

Exemplo de retorno:

```ts
type NotionDatabaseOption = {
  id: string;
  title: string;
};
```

## Implementação no backend

Usar a API oficial do Notion. Em workspaces com data sources, preferir `data_source` como filtro de busca:

```ts
const response = await notion.search({
  filter: {
    property: "object",
    value: "data_source",
  },
});
```

Normalizar o resultado antes de enviar para a UI:

```ts
const databases = response.results
  .filter((item) => item.object === "database")
  .map((database) => ({
    id: database.id,
    title:
      "title" in database && Array.isArray(database.title)
        ? database.title.map((text) => text.plain_text).join("") || "Sem nome"
        : "Sem nome",
  }));
```

O endpoint deve retornar um resultado previsível:

```ts
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };
```

## Comportamento da interface

Na tela de configurações, incluir:

- Botão `Buscar databases`.
- Estado de loading durante a busca.
- Lista ou select com as databases encontradas.
- Preenchimento automático do `databaseId` ao selecionar uma database.
- Mensagem amigável quando nenhuma database for encontrada.
- Botão `Testar conexão` após a seleção.

Fluxo recomendado:

1. Usuário informa e salva o token do Notion.
2. Usuário clica em `Buscar databases`.
3. App chama `POST /api/notion/databases`.
4. API route busca databases/data sources pela API oficial do Notion.
5. UI exibe as opções encontradas.
6. Usuário seleciona uma database.
7. App preenche o `databaseId`.
8. Usuário salva e testa a conexão.

## Mensagens amigáveis

Quando nenhuma database aparecer:

```txt
Nenhuma database foi encontrada. Verifique se a database foi compartilhada com a integração do Notion.
```

Quando o token estiver ausente:

```txt
Salve o token do Notion antes de buscar suas databases.
```

Quando a busca falhar:

```txt
Não foi possível buscar suas databases. Confira o token do Notion e tente novamente.
```

## Critério de aceite adicional

O projeto também estará correto quando:

- Permitir buscar databases do Notion pela API oficial.
- Exibir as databases acessíveis em um seletor na interface.
- Preencher o `databaseId` automaticamente ao selecionar uma database.
- Manter o token mascarado na interface e fora dos logs.
- Tratar ausência de databases com mensagem clara sobre compartilhamento da integração.

## Campo Categoria

A database do Notion também deve possuir a propriedade:

```txt
Categoria
```

Tipo no Notion:

```txt
Select
```

Também aceitar quando o Notion retornar a propriedade como:

- `relation`
- `status`
- `multi_select`

Nesses casos, o payload de importação deve respeitar o tipo real da propriedade.

As opções cadastradas de `Categoria` devem ser lidas automaticamente da propriedade `Categoria` no Notion.

Não hardcodar a lista de categorias no frontend, no schema Zod ou nos services. A lista deve vir de:

```ts
container.properties[settings.notionProperties.category].select.options
container.properties[settings.notionProperties.category].status.options
container.properties[settings.notionProperties.category].multi_select.options
```

Quando `Categoria` for `relation`, as categorias devem ser buscadas consultando a data source relacionada:

```ts
container.properties[settings.notionProperties.category].relation.data_source_id
```

O app deve consultar as páginas dessa data source relacionada e usar o título de cada página como opção de categoria.

Observações:

- Se o usuário escrever `Àgua`, normalizar no app para `Água`, que é a grafia correta da categoria.
- A lista retornada pelo Notion deve ser usada como fonte da verdade.
- A UI deve funcionar como um combobox: sugerir categorias existentes vindas do Notion, mas permitir digitar uma categoria nova.
- Quando `Categoria` for `select` ou `multi_select`, uma categoria digitada manualmente pode ser enviada ao Notion; a API cria a opção automaticamente se a integração tiver permissão.
- Quando `Categoria` for `status`, a categoria precisa existir previamente no Notion.
- Quando `Categoria` for `relation`, uma categoria digitada manualmente deve criar uma nova página na data source relacionada antes de importar a transação.
- Como o CSV bancário não traz categoria, toda transação importada deve receber inicialmente uma categoria padrão.
- A categoria padrão inicial deve ser `Itens Básicos` quando essa opção existir no Notion; se não existir, usar a primeira opção retornada pelo Notion.
- A arquitetura deve permitir evoluir depois para categorização automática por palavras-chave.

## Mapeamento Categoria para Notion

Adicionar ao mapeamento de importação:

| Origem | Destino no Notion | Regra |
| --- | --- | --- |
| Categoria definida pelo app | `Categoria` | Enviar como Select |

Exemplo de payload:

```ts
[settings.notionProperties.category]: {
  select: {
    name: transaction.category,
  },
}
```

## Schemas com Categoria

`TransactionSchema` deve incluir:

```ts
category: z.string().min(1).default("Itens Básicos")
```

O Zod não deve hardcodar as opções de categoria. A validação contra opções existentes deve vir da data source do Notion quando necessário.

`SettingsSchema` deve permitir configurar o nome da propriedade:

```ts
notionProperties: {
  category: "Categoria"
}
```

## UI com Categoria

A tela de configurações deve incluir o campo de nome da propriedade `Categoria`.

A tabela de pré-visualização deve exibir a coluna `Categoria`.

A importação para o Notion deve validar se a propriedade configurada para categoria existe e é do tipo `select`.

A API route do Next deve expor um endpoint para buscar as opções reais:

```txt
POST /api/notion/property-options
```

Esse endpoint deve:

- Ler as configurações salvas.
- Buscar a data source/database configurada.
- Ler as opções do select configurado como `Categoria`.
- Retornar `categoryOptions`, `bankOptions` e `investmentOptions` com os nomes encontrados.
- Nunca consultar o Notion diretamente pelo React.

## Campos completos da database Transações

A database/data source `Transações` possui os seguintes campos e tipos esperados:

| Propriedade | Tipo no Notion | Uso no app |
| --- | --- | --- |
| `Nome` | Title | Título da transação, montado como `Histórico - Descrição` |
| `Realizado` | Checkbox | Deve ser `true` para lançamentos importados de extrato |
| `Tipo` | Select | `Entrada` ou `Saída` |
| `Data` | Date | Data convertida de `DD/MM/YYYY` para `YYYY-MM-DD` |
| `Valor` | Number/Currency | Valor original da transação |
| `Categoria` | Relation/Select/Status/Multi-select | Categoria inicial da transação |
| `Banco` | Relation/Select/Status/Multi-select | Conta/banco da transação, preferencialmente vindo da data source `(PES) Conta` |
| `Dívida` | Relation/Select/Outro | Campo existente na database; não preencher automaticamente na primeira versão |
| `Investimento` | Relation/Select/Status/Multi-select | Investimento relacionado à transação, vindo preferencialmente de `(PES) Investimento` |
| `Valor Previsto` | Number/Currency ou outro tipo opcional | Deve ficar vazio/null para lançamentos importados de extrato |
| `Valor Realizado` | Number/Currency | Deve receber o mesmo valor realizado da transação importada |

Regras de importação para os campos completos:

- `Realizado` deve ser enviado como checkbox marcado.
- `Valor` deve ser enviado ao Notion como número positivo, usando `Math.abs(transaction.amount)`.
- `Valor Realizado` deve ser enviado ao Notion como número positivo, usando `Math.abs(transaction.realizedAmount)`.
- O sinal negativo do CSV deve servir apenas para detectar `Tipo = Saída`; não deve ser persistido nos campos numéricos do app nem do Notion.
- A pré-visualização editável deve exibir saídas sem sinal de menos, mantendo a cor/coluna `Tipo` para indicar que é saída.
- `Valor Previsto` deve ser enviado como `null` somente se a propriedade for do tipo `number`; caso contrário, deve ser omitido.
- `Dívida` deve existir na configuração, mas não deve ser preenchida automaticamente enquanto não houver regra específica.
- `Investimento` deve ficar vazio por padrão, mas pode ser preenchido pelo usuário na pré-visualização do CSV.
- Quando `Investimento` for relation, as opções devem ser buscadas da data source relacionada `(PES) Investimento`.
- Se o usuário digitar um novo investimento na pré-visualização, o app deve criar uma nova página na data source relacionada antes de importar a transação.
- A validação de conexão deve conferir os campos principais usados na importação: `Nome`, `Realizado`, `Tipo`, `Data`, `Valor`, `Categoria`, `Banco`, `Valor Previsto` e `Valor Realizado`.
- `Categoria` deve aceitar `relation`, `select`, `status` ou `multi_select`, usando o payload correspondente ao tipo real.
- `Banco` deve aceitar `relation`, `select`, `status` ou `multi_select`, usando o payload correspondente ao tipo real.
- Quando `Banco` for `relation`, as opções devem ser buscadas da data source relacionada, como `(PES) Conta`.
- O seletor principal de banco e o seletor de banco em cada linha do CSV devem usar as opções reais carregadas do Notion.
- Se o CSV já foi carregado, cada linha deve continuar editável e permitir trocar o banco/conta individualmente.
- Ao selecionar um arquivo CSV, o app deve ler e validar automaticamente, sem botão separado de validação.
- O valor selecionado em `Banco` não deve bloquear o parser. O banco selecionado serve para preencher a propriedade `Banco`/conta da transação.
- Enquanto só houver parser do formato Inter, qualquer banco/conta selecionado deve poder importar um CSV compatível com o formato Inter.
- Ao criar páginas no Notion, usar templates da data source conforme o tipo da transação:
  - `Tipo = Entrada` deve usar o template `Nova Entrada`.
  - `Tipo = Saída` deve usar o template `Nova Saída`.
- Os templates devem ser encontrados automaticamente pela API oficial de templates da data source.
- Se o template necessário não existir ou não estiver acessível para a integração, a importação deve retornar erro amigável.

`SettingsSchema` deve manter internamente os nomes esperados:

```ts
notionProperties: {
  realized: "Realizado",
  date: "Data",
  name: "Nome",
  type: "Tipo",
  amount: "Valor",
  bank: "Banco",
  category: "Categoria",
  debt: "Dívida",
  investment: "Investimento",
  expectedAmount: "Valor Previsto",
  realizedAmount: "Valor Realizado",
}
```

A tela de configurações não deve expor formulário para o usuário editar esses nomes manualmente por padrão.

O app deve detectar automaticamente:

- Se a propriedade existe.
- Qual é o tipo real retornado pelo Notion.
- Se a propriedade é `relation`.
- Qual `data_source_id` está relacionado quando for relation.

Exemplos:

- `Categoria` relation -> detectar data source `(PES) Categoria`.
- `Banco` relation -> detectar data source `(PES) Conta`.
- `Investimento` relation -> detectar data source `(PES) Investimento`.

A tela de configurações deve mostrar um resumo somente leitura das propriedades detectadas.

`TransactionSchema` deve incluir:

```ts
realized: z.boolean().default(true),
expectedAmount: z.number().nullable().default(null),
realizedAmount: z.number(),
debt: z.string().nullable().default(null),
investment: z.string().nullable().default(null),
```

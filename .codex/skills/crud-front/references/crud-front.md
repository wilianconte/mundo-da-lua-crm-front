# CRUD Front - Mundo da Lua CRM

Esta referencia padroniza como construir CRUDs consistentes no front do Mundo da Lua CRM.

## 1. Implementacao de referencia atual

Usar o CRUD de pessoas como baseline oficial:

- `app/(dashboard)/pessoas/pesquisa/page.tsx`
- `app/(dashboard)/pessoas/cadastro/page.tsx`
- `src/features/pessoas/components/person-search-view.tsx`
- `src/features/pessoas/components/person-registration-view.tsx`
- `src/features/pessoas/api/get-people.ts`
- `src/features/pessoas/api/person-upsert.ts`
- `src/features/pessoas/schema/person-registration-schema.ts`

Nao usar `src/features/clientes/*` como fonte de verdade para CRUDs de producao enquanto aquele modulo continuar local/demonstrativo.

## 2. Estrutura canonica por dominio

Organizar cada CRUD por dominio:

```text
app/(dashboard)/<dominio>/
|-- pesquisa/page.tsx
`-- cadastro/page.tsx

src/features/<dominio>/
|-- api/
|-- components/
`-- schema/
```

Responsabilidades:

- `page.tsx`: apenas compor a view da feature
- `api/`: concentrar query, mutation, tipos e funcoes de acesso
- `schema/`: validar e normalizar dados do formulario
- `components/`: conter a view da listagem e a view de cadastro/edicao

## 3. Listagem

Toda listagem de CRUD deve, quando aplicavel:

- carregar dados por GraphQL a partir da camada `api/`
- exibir loading, erro e empty state
- oferecer CTA claro para novo cadastro
- permitir entrada para edicao a partir da linha da tabela
- manter filtros, ordenacao e paginacao perto da view da feature
- evitar colocar logica de GraphQL em componentes `ui`

Padrao observado em `pessoas`:

- busca livre e filtros tokenizados
- ordenacao por colunas
- paginacao por cursor
- botao `Adicionar` apontando para `/cadastro`
- botao `Editar` apontando para `/cadastro?mode=edit&id=<uuid>`

Regra adicional:

- toda listagem CRUD nova deve usar o modelo de `pessoas` como referencia obrigatoria para UX e estrutura (Omnisearch tokenizado + tabela + estados + navegacao)

## 4. Cadastro e alteracao

O formulario de criacao e edicao deve ser unico sempre que o contrato permitir.

Padrao atual:

- detectar modo de edicao via `searchParams`
- carregar o registro por ID somente em edicao
- usar `React Hook Form` com `zodResolver`
- aplicar mascaras e normalizacao no front apenas para a experiencia de digitacao
- enviar para a API valores limpos e opcionais como `undefined`
- reutilizar o mesmo layout para criar e atualizar

Estados obrigatorios:

- loading do registro em edicao
- erro global de formulario quando a leitura ou mutation falhar
- erros por campo via `FieldMessage`
- feedback de sucesso com redirecionamento para a listagem
- em atualizacao, usar modal de sucesso e somente depois redirecionar (mesmo padrao de `pessoas`)

## 5. Exclusao

Exclusao em CRUD de producao deve seguir estas regras:

- aparecer apenas em modo de edicao
- exigir confirmacao explicita antes da mutation
- a confirmacao deve ser feita por modal dedicada (padrao do projeto), nunca por `window.confirm`
- bloquear a UI durante a operacao
- exibir modal de sucesso consistente
- redirecionar para a listagem apos concluir
- o redirecionamento deve acontecer apos a modal de sucesso (nao imediatamente apos a mutation)

Evitar:

- excluir sem modal ou confirmacao
- manter o usuario preso na tela apos exclusao bem-sucedida
- misturar exclusao com acao primaria de salvar

## 6. Camada de API

Cada CRUD deve ter uma camada de API da propria feature.

Padrao recomendado:

- criar uma query especifica para listagem
- criar um arquivo de upsert ou separar `create`, `update`, `delete` quando a feature crescer
- tipar resposta e variaveis perto da operacao
- exportar funcoes pequenas como `getPeople`, `getPersonById`, `createPerson`, `updatePerson`, `deletePerson`
- mapear erros de negocio em uma funcao como `mapPersonApiError`

Regra obrigatoria:

- toda operacao deve usar `gqlRequest` de `src/lib/graphql/client.ts`

## 7. Rotas e navegacao

Enquanto o projeto nao oficializar outra convencao, usar:

- `/pesquisa` para listagem
- `/cadastro` para criacao
- `/cadastro?mode=edit&id=<uuid>` para edicao

Boas praticas:

- manter a navegacao de ida e volta simples
- apos salvar ou excluir, voltar para a listagem
- manter rotulos previsiveis: `Adicionar`, `Salvar`, `Salvar alteracoes`, `Excluir`

## 8. Checklist de review

Antes de aprovar um CRUD, confirmar:

- existe uma listagem real, nao apenas um formulario isolado
- a listagem chama a API da feature e nao usa mock local em producao
- o formulario usa schema `Zod`
- criacao e alteracao compartilham a mesma base de formulario
- exclusao pede confirmacao
- loading, empty, error e success estao cobertos
- erros GraphQL foram traduzidos para UX amigavel
- a implementacao segue o mesmo padrao visual e estrutural de `pessoas`

## 9. Melhorias futuras desejaveis

Quando houver mais de um CRUD integrado no mesmo padrao, considerar:

- extrair composites reutilizaveis para filtros, cabecalhos e tabelas densas
- padronizar helpers compartilhados para mapeamento de erro e redirecionamento pos-sucesso
- ampliar testes de fluxos criticos de listagem, criar, editar e excluir

# Mundo da Lua CRM — Frontend

## Escopo por agente

- Codex: usa `AGENTS.md` como entrada principal e deve consultar `.codex/skills/*` para fluxo de implementação.
- Claude Code: deve carregar `CLAUDE.md` (que importa `AGENTS.md`) e aplicar as mesmas regras de contrato e validação.
- Regra de consistência: qualquer instrução global deste repositório deve permanecer compatível entre `AGENTS.md` e `CLAUDE.md`.

## Precedência de instruções

- Não sobrescrever instruções específicas de skill (`.codex/skills/*`) com regras globais conflitantes.
- Em caso de conflito entre orientação geral e implementação de dados, priorizar sempre o contrato GraphQL (`contracts/schema.graphql`).

## Contrato GraphQL

Toda implementação de tela que consuma dados do backend **deve se basear no contrato local** em [contracts/schema.graphql](contracts/schema.graphql).

O contrato é a fonte de verdade sobre quais queries, mutations, tipos e campos estão disponíveis. Não consulte o backend diretamente para descobrir a API — leia o schema.

### Regras

- Antes de qualquer implementação, execute `npm run graphql:contract:update` para sincronizar o contrato local e revisar o diff gerado.
- Antes de implementar uma query ou mutation, verifique no contrato se o campo raiz existe em `Query` ou `Mutation`.
- Antes de selecionar campos aninhados, verifique os tipos correspondentes no contrato.
- Nunca assuma que um campo existe sem confirmar no schema — o build falhará se o contrato for violado.

### Atualizando o contrato

Quando o backend evoluir, sincronize o contrato local e revise o diff antes de continuar:

```bash
npm run graphql:contract:update
```

O comando exibe as linhas adicionadas e removidas. Se alguma query ou mutation usada no front tiver sido removida ou renomeada, ajuste o código antes de commitar.

### Validação automática

A validação do contrato roda automaticamente em:

- `npm run dev` — antes de subir o servidor de desenvolvimento
- `npm run build` — antes de compilar para produção

Se a validação falhar, o processo é interrompido com a lista de operações incompatíveis.

## Comandos padrão

- Instalar dependências: `npm install`
- Rodar ambiente de desenvolvimento: `npm run dev`
- Validar lint: `npm run lint`
- Validar build de produção: `npm run build`
- Atualizar contrato GraphQL local: `npm run graphql:contract:update`

## Skills recomendadas por tipo de tarefa

- Ordem de prioridade quando mais de uma skill se aplicar: `dev-admin` → `vercel-react-best-practices` → `vercel-composition-patterns` → `web-design-guidelines` → `crud-front` → `mundo-da-lua-auth-graphql` → `review-front` → `auto-melhorar-front`.
- Cadência recomendada para `auto-melhorar-front`: executar após 5-10 tarefas relevantes ou quando houver retrabalho recorrente.
- Arquitetura e padrões gerais de front: `dev-admin`
- Performance e boas práticas React/Next.js: `vercel-react-best-practices`
- Composição de componentes React escalável: `vercel-composition-patterns`
- Revisão de UI/UX e acessibilidade baseada em guidelines web: `web-design-guidelines`
- CRUD (listagem/cadastro/edição/exclusão): `crud-front`
- Autenticação, sessão e rotas protegidas: `mundo-da-lua-auth-graphql`
- Revisão técnica de PR/diff front: `review-front`
- Melhoria contínua das instruções do agente: `auto-melhorar-front`

## Validação mínima por tipo de tarefa

- UI simples (sem GraphQL/auth): validar `npm run lint`.
- CRUD com GraphQL: validar `npm run graphql:contract:update`, `npm run lint` e `npm run build`.
- Autenticação/sessão: validar `npm run lint` e `npm run build`, confirmando tratamento de sessão expirada e `AUTH_NOT_AUTHORIZED`.

## Exemplos de prompt bom

- UI: "Ajuste a tela `src/features/alunos/components/student-search-view.tsx` para melhorar alinhamento do cabeçalho e espaçamento dos filtros sem mudar regras de negócio; rode `npm run lint`."
- CRUD GraphQL: "Implemente campo `nickname` no cadastro de pessoas (`/pessoas/cadastro`) com query/mutation compatível com `contracts/schema.graphql`; atualize contrato local e valide build."
- Auth: "No fluxo de sessão, trate `AUTH_NOT_AUTHORIZED` no client GraphQL limpando sessão e redirecionando para `/login`; valide `lint` e `build`."

## Checklist de entrega

- Confirmar compatibilidade com `contracts/schema.graphql` para queries/mutations alteradas.
- Executar e revisar `npm run graphql:contract:update` quando houver mudança de contrato.
- Validar `npm run lint`.
- Validar `npm run build`.
- Se algum passo não puder ser executado, registrar claramente o que faltou e o motivo.



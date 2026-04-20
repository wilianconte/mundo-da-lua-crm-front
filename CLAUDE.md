@AGENTS.md

## Claude Code

- Sempre verificar o contrato em `contracts/schema.graphql` antes de criar ou alterar qualquer query/mutation/campo.
- Se o trabalho tocar em GraphQL, executar `npm run graphql:contract:update` antes de implementar e revisar o diff.
- Preferir padrões existentes nas skills de projeto em `.codex/skills/` para manter consistência arquitetural.
- Antes de concluir, validar com `npm run lint` e `npm run build` (ou informar claramente se não foi possível executar).

## Ordem de execução recomendada

1. Identificar o tipo de tarefa (arquitetura, CRUD, auth, review).
2. Acionar a skill mais adequada (`dev-admin`, `vercel-react-best-practices`, `vercel-composition-patterns`, `web-design-guidelines`, `crud-front`, `mundo-da-lua-auth-graphql`, `review-front`, `auto-melhorar-front`).
3. Confirmar contrato GraphQL em `contracts/schema.graphql` para qualquer mudança de dados.
4. Executar validações mínimas da tarefa e registrar claramente qualquer limitação de execução.

Ordem de prioridade quando mais de uma skill se aplicar: `dev-admin` → `vercel-react-best-practices` → `vercel-composition-patterns` → `web-design-guidelines` → `crud-front` → `mundo-da-lua-auth-graphql` → `review-front` → `auto-melhorar-front`.
Cadência recomendada para `auto-melhorar-front`: executar após 5-10 tarefas relevantes ou quando houver retrabalho recorrente.
Para processamento em lote de requisicoes na pasta `input`, acionar `processar-solicitacoes`.



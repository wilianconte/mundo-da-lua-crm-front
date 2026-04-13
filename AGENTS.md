# Mundo da Lua CRM — Frontend

## Contrato GraphQL

Toda implementação de tela que consuma dados do backend **deve se basear no contrato local** em [contracts/schema.graphql](contracts/schema.graphql).

O contrato é a fonte de verdade sobre quais queries, mutations, tipos e campos estão disponíveis. Não consulte o backend diretamente para descobrir a API — leia o schema.

### Regras

- Antes de qualquer implementacao, execute `npm run graphql:contract:update` para sincronizar o contrato local e revisar o diff gerado.
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

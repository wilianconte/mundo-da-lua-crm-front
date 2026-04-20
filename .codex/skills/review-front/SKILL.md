---
name: review-front
description: Padrao de revisao tecnica para PRs do front-end do Mundo da Lua CRM. Use para identificar bugs, regressao de comportamento, violacao de contrato GraphQL, falhas de loading/empty/error/success, e riscos de acessibilidade e responsividade.
---

# Review Front

Use esta skill quando a tarefa for revisar alteracoes no front-end.

## Quando usar

- revisar PRs, diffs ou alteracoes locais no front
- validar se mudancas seguem arquitetura e padroes do projeto
- procurar risco funcional antes de merge

## Quando nao usar

- implementar feature nova sem revisao de codigo existente
- tarefa exclusiva de backend sem impacto no front

## Dependencias com outras skills

- usar junto com `dev-admin` para validar arquitetura, componentizacao e padroes de UI
- usar junto com `crud-front` quando o diff envolver listagem/cadastro/edicao/exclusao
- usar junto com `mundo-da-lua-auth-graphql` quando houver login, sessao, logout ou rotas autenticadas

## Checklist de revisao

1. Bugs e regressao
- identificar alteracoes que podem quebrar fluxo existente
- validar condicoes limite e nulos/undefined
- verificar mudancas de contrato de props, estados e callbacks

2. Contrato GraphQL
- confirmar compatibilidade com `contracts/schema.graphql`
- validar nome de query/mutation e campos selecionados
- sinalizar risco quando o diff assume campo sem evidencias no contrato

3. Estados de tela
- confirmar cobertura de `loading`, `empty`, `error` e `success` quando aplicavel
- verificar feedback visual e mensagens de erro acionaveis

4. Autenticacao e autorizacao
- validar tratamento de `AUTH_NOT_AUTHORIZED` quando houver chamadas autenticadas
- confirmar fluxo de sessao (login/logout/expiracao) sem regressao

5. Acessibilidade e responsividade
- checar semantica basica, foco navegavel e labels
- revisar comportamento em breakpoints principais

## Formato de saida

- listar achados primeiro, ordenados por severidade
- para cada achado, incluir arquivo e linha quando possivel
- se nao houver achados, declarar explicitamente "Nenhum achado critico encontrado"
- finalizar com riscos residuais e lacunas de teste

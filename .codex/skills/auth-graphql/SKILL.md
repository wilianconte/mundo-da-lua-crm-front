---
name: mundo-da-lua-auth-graphql
description: Padrao oficial de autenticacao GraphQL do Mundo da Lua CRM front. Use para login, sessao, logout, injecao de Bearer token, tratamento de AUTH_NOT_AUTHORIZED e protecao de rotas.
---

# Mundo Da Lua Auth GraphQL

Use esta skill sempre que houver alteracoes relacionadas a autenticacao no front-end.

## Quando usar

- implementar login
- integrar chamadas GraphQL autenticadas
- proteger rotas autenticadas
- implementar logout
- tratar sessao expirada
- revisar se uma feature esta obedecendo o fluxo de auth oficial

## Quick Start

1. Ler `references/auth-graphql.md`.
2. Usar cliente GraphQL centralizado em `src/lib/graphql/client.ts`.
3. Preservar `app/api/graphql/route.ts` como proxy oficial entre browser e backend GraphQL.
4. Usar sessao centralizada em `src/lib/auth/session.ts`.
5. Para login, chamar `gqlRequest` com `{ requiresAuth: false }`.
6. Em CRUDs autenticados, manter queries/mutations dentro da feature e usar esta skill junto com `../crud-front/references/crud-front.md`.
7. Nao criar chamadas `fetch` soltas para login/auth fora dessas camadas sem justificativa.

## Regras obrigatorias

- Toda comunicacao com backend deve ser GraphQL.
- Toda requisicao autenticada deve enviar `Authorization: Bearer <token>`.
- `tenantId` so deve ser enviado no login.
- Persistir `auth_token`, `auth_expires_at` e `auth_user`.
- Se sessao expirar ou API retornar `AUTH_NOT_AUTHORIZED`, limpar sessao e redirecionar para `/login`.
- Enquanto refresh token nao existir no backend, validar `expiresAt` no front antes de requisicoes autenticadas.

## Estrutura recomendada

- `app/api/graphql/route.ts`: proxy Next para o endpoint GraphQL oficial.
- `src/lib/auth/session.ts`: armazenamento e validacao da sessao.
- `src/lib/graphql/client.ts`: request centralizado, auth header, tratamento de erros.
- `src/features/auth/api/login.ts`: mutation de login.
- `src/features/auth/components/*`: formulario de login, guard e fluxos de UI.

## Antes de finalizar

- confirmar que login salva sessao corretamente
- confirmar que login usa `requiresAuth: false`
- confirmar que o proxy `app/api/graphql/route.ts` continua sendo a unica saida HTTP do browser para GraphQL
- confirmar que chamadas autenticadas injetam Bearer
- confirmar que logout limpa storage e redireciona
- confirmar que rota autenticada bloqueia acesso sem sessao valida
- confirmar tratamento de `INVALID_CREDENTIALS`, `USER_INACTIVE`, `VALIDATION_ERROR`, `AUTH_NOT_AUTHORIZED`

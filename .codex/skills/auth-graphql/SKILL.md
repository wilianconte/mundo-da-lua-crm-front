---
name: mundo-da-lua-auth-graphql
description: Padrao oficial de autenticacao GraphQL do Mundo da Lua CRM front. Use para login, sessao, logout, injecao de Bearer token, tratamento de AUTH_NOT_AUTHORIZED e protecao de rotas.
---

# Mundo da Lua Auth GraphQL

Use esta skill sempre que houver alteracoes relacionadas a autenticacao no front-end.

## Quando usar

- implementar login
- integrar chamadas GraphQL autenticadas
- proteger rotas autenticadas
- implementar logout
- tratar sessao expirada
- revisar se uma feature esta obedecendo o fluxo oficial de auth

## Quando nao usar

- mudancas de arquitetura geral sem foco em autenticacao (usar `dev-admin`)
- CRUD de dominio sem alteracao de login/sessao/token (usar `crud-front`)

## Dependencias com outras skills

- usar junto com `crud-front` quando o CRUD exigir autenticacao/autorizacao
- usar junto com `dev-admin` quando houver impacto de arquitetura/roteamento

## Quick Start

1. Ler `references/auth-graphql.md`.
2. Usar cliente GraphQL centralizado em `src/lib/graphql/client.ts`.
3. Preservar `app/api/graphql/route.ts` como proxy oficial entre browser e backend GraphQL.
4. Preservar `app/api/auth/session/route.ts` para sincronizacao server-side de cookies de sessao.
5. Preservar `proxy.ts` como gate primario de rotas autenticadas (substitui `middleware.ts` no Next.js atual).
6. Usar sessao centralizada em `src/lib/auth/session.ts`.
7. Para login, chamar `gqlRequest` com `{ requiresAuth: false }`.
8. Em CRUDs autenticados, manter queries/mutations dentro da feature e usar esta skill junto com `../crud-front/references/crud-front.md`.
9. Nao criar chamadas `fetch` soltas para login/auth fora dessas camadas sem justificativa.

## Regras obrigatorias

- Toda comunicacao com backend deve ser GraphQL.
- Toda requisicao autenticada deve enviar `Authorization: Bearer <token>`.
- `tenantId` deve ser enviado no login e no `refreshToken`.
- Persistir em `localStorage`: `auth_token`, `auth_expires_at`, `auth_refresh_token`, `auth_refresh_expires_at`, `auth_tenant_id`, `auth_user`.
- Sincronizar cookie de sessao `httpOnly` no servidor via `POST/DELETE /api/auth/session`.
- Validar assinatura da sessao no gate server-side (`proxy.ts`) antes de liberar rota privada.
- Em producao, exigir `AUTH_GATE_SECRET` (ou `NEXTAUTH_SECRET`) para assinatura da sessao.
- Se sessao expirar ou API retornar `AUTH_NOT_AUTHORIZED`, limpar sessao e redirecionar para `/login`.

## Estrutura recomendada

- `app/api/graphql/route.ts`: proxy Next para o endpoint GraphQL oficial.
- `app/api/auth/session/route.ts`: escrita/limpeza server-side de cookies `httpOnly` da sessao.
- `proxy.ts`: gate server-side da area autenticada.
- `src/lib/auth/session.ts`: armazenamento e validacao da sessao no browser + sincronizacao com servidor.
- `src/lib/auth/server-session-signature.ts`: assinatura e validacao de integridade da sessao.
- `src/lib/graphql/client.ts`: request centralizado, auth header e tratamento de erros.
- `src/features/auth/api/login.ts`: mutation de login.
- `src/features/auth/components/*`: formulario de login, guard e fluxos de UI.

## Antes de finalizar

- confirmar que login salva sessao corretamente
- confirmar que login usa `requiresAuth: false`
- confirmar que o proxy `app/api/graphql/route.ts` continua sendo a unica saida HTTP do browser para GraphQL
- confirmar que chamadas autenticadas injetam Bearer
- confirmar que `saveAuthSession`/`clearAuthSession` sincronizam cookie server-side
- confirmar que logout limpa storage, cookie e redireciona
- confirmar que `proxy.ts` bloqueia acesso sem sessao valida
- confirmar `AUTH_GATE_SECRET` (ou `NEXTAUTH_SECRET`) definido em producao
- confirmar tratamento de `INVALID_CREDENTIALS`, `USER_INACTIVE`, `VALIDATION_ERROR`, `AUTH_NOT_AUTHORIZED`

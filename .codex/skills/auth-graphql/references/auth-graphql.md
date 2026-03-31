# Auth GraphQL - Mundo da Lua CRM Front

Esta referencia define o fluxo oficial de autenticacao do front.

## Endpoint e protocolo

- URL da API GraphQL: `https://mundo-da-lua-crm-core.onrender.com/graphql/`
- Todas as operacoes via `POST` + JSON
- `Content-Type: application/json`
- Requisicoes autenticadas exigem:
  - `Authorization: Bearer <token>`

## Login (sem Bearer)

Mutation:

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    expiresAt
    refreshToken
    refreshTokenExpiresAt
    userId
    name
    email
  }
}
```

Variaveis (base atual):

```json
{
  "input": {
    "tenantId": "00000000-0000-0000-0000-000000000001",
    "email": "admin@mundodalua.com",
    "password": "Admin@123"
  }
}
```

## Persistencia de sessao no front

Salvar em `localStorage`:

- `auth_token`
- `auth_expires_at`
- `auth_refresh_token`
- `auth_refresh_expires_at`
- `auth_tenant_id`
- `auth_user` com:
  - `userId`
  - `name`
  - `email`

Sincronizar no servidor via `/api/auth/session` cookies `httpOnly`:

- `auth_token`
- `auth_expires_at`
- `auth_refresh_token`
- `auth_refresh_expires_at`
- `auth_tenant_id`
- `auth_session_sig` (assinatura de integridade)

## Requisicoes GraphQL autenticadas

Todo request (exceto login) deve incluir Bearer.

Padrao recomendado:

- usar `src/lib/graphql/client.ts`
- preservar `app/api/graphql/route.ts` como proxy oficial para o endpoint externo
- concentrar tratamento de erro e redirecionamento para login nesta camada
- para login, usar `gqlRequest(..., { requiresAuth: false })`
- para CRUDs autenticados, manter queries e mutations dentro da feature de dominio

## Sessao expirada

- se `auth_token` estiver expirado, tentar renovar via mutation GraphQL `refreshToken`
- se renovacao falhar (ou `AUTH_NOT_AUTHORIZED`):
  - limpar storage/cookies de auth
  - redirecionar para `/login`

## Logout

No logout:

- limpar `auth_token`, `auth_expires_at`, `auth_refresh_token`, `auth_refresh_expires_at`, `auth_tenant_id`, `auth_user`
- redirecionar para `/login`

## Tratamento de erros GraphQL

Formato esperado:

```json
{
  "errors": [
    {
      "message": "Credenciais invalidas.",
      "extensions": {
        "code": "INVALID_CREDENTIALS"
      }
    }
  ]
}
```

Codigos relevantes:

- `VALIDATION_ERROR`
- `INVALID_CREDENTIALS`
- `USER_INACTIVE`
- `AUTH_NOT_AUTHORIZED`

Acao esperada:

- `AUTH_NOT_AUTHORIZED`: limpar sessao e redirecionar para login
- demais codigos: exibir mensagem amigavel na UI

## Implementacao atual no repositorio

- Sessao: `src/lib/auth/session.ts`
- Client GraphQL: `src/lib/graphql/client.ts`
- API login: `src/features/auth/api/login.ts`
- Form login: `src/features/auth/components/login-form.tsx`
- Guard dashboard: `src/features/auth/components/dashboard-auth-guard.tsx`
- Proxy Next para GraphQL: `app/api/graphql/route.ts`
- API de sessao para cookies `httpOnly`: `app/api/auth/session/route.ts`
- Gate server-side de rotas: `proxy.ts`
- Assinatura de sessao: `src/lib/auth/server-session-signature.ts`

## Checklist rapido para PR

- login funciona com mutation GraphQL
- login usa `requiresAuth: false`
- sessao persiste no storage com as chaves corretas
- `saveAuthSession` e `clearAuthSession` sincronizam cookies via `/api/auth/session`
- browser continua usando `/api/graphql` em vez de chamar o endpoint externo diretamente
- bearer injetado em requests autenticados
- `proxy.ts` bloqueia acesso sem sessao valida
- expiracao dispara tentativa de `refreshToken` antes de encerrar sessao
- logout limpa storage + cookies e redireciona
- `AUTH_GATE_SECRET` (ou `NEXTAUTH_SECRET`) definido em producao
- erros de auth tratados com UX clara

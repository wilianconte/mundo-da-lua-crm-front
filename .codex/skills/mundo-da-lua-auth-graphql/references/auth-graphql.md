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
- `auth_user` com:
  - `userId`
  - `name`
  - `email`

`tenantId` nao precisa ser persistido no front para requests autenticados.

## Requisicoes GraphQL autenticadas

Todo request (exceto login) deve incluir Bearer.

Padrao recomendado:

- usar `src/lib/graphql/client.ts`
- concentrar tratamento de erro e redirecionamento para login nesta camada

## Sessao expirada

Enquanto nao houver refresh token:

- validar `expiresAt` localmente antes de requests autenticados
- se expirado:
  - limpar storage de auth
  - redirecionar para `/login`

## Logout

No logout:

- limpar `auth_token`, `auth_expires_at`, `auth_user`
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

## Checklist rapido para PR

- login funciona com mutation GraphQL
- sessao persiste no storage com as chaves corretas
- bearer injetado em requests autenticados
- expiracao local bloqueia uso de token vencido
- logout limpa sessao e redireciona
- erros de auth tratados com UX clara


# Mundo da Lua CRM Front

Aplicacao front-end do Mundo da Lua CRM, focada em operacao administrativa multi-tenant para escola, clinica, atendimento, financeiro e modulos de apoio.

## Visao geral

O projeto usa `Next.js` com `App Router`, `React 19`, `TypeScript` e `Tailwind CSS 4`.

Hoje, o modulo de `pessoas` e a principal referencia real de CRUD integrado via GraphQL. Outros modulos ainda estao em fase de bootstrap visual ou demonstrativa.

## Stack principal

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `React Hook Form`
- `Zod`
- `Sentry`
- `Lucide React`

## Como rodar localmente

1. Instalar dependencias com `npm install`
2. Iniciar o ambiente com `npm run dev`
3. Executar validacao basica com `npm run lint`

## Scripts disponiveis

- `npm run dev`: sobe o ambiente de desenvolvimento
- `npm run build`: gera o build de producao
- `npm run start`: sobe o build gerado
- `npm run lint`: roda o lint do projeto

## Autenticacao e GraphQL

O backend oficial e exposto em `https://mundo-da-lua-crm-core.onrender.com/graphql/`.

No front, o browser fala com o proxy `app/api/graphql/route.ts`, e a camada oficial de acesso a dados e `src/lib/graphql/client.ts`.

O fluxo atual de sessao usa `localStorage` com as chaves:

- `auth_token`
- `auth_expires_at`
- `auth_user`

Enquanto o backend nao oferecer refresh token, a expiracao e validada no front antes de requests autenticados. Se a API retornar `AUTH_NOT_AUTHORIZED`, a sessao local e limpa e o usuario volta para `/login`.

## Estrutura do projeto

```text
app/
|-- (public)/login
|-- (dashboard)/
|   |-- pessoas/
|   |-- clientes/
|   |-- system-design/
|   `-- page.tsx
`-- api/graphql/route.ts

src/
|-- components/
|-- config/
|-- features/
|   |-- auth/
|   |-- dashboard/
|   |-- pessoas/
|   |-- clientes/
|   `-- system-design/
`-- lib/
    |-- auth/
    `-- graphql/
```

## Modulos e status atual

- `auth`: login com mutation GraphQL, persistencia de sessao e protecao de area autenticada
- `dashboard`: shell administrativa inicial e cards de resumo
- `pessoas`: CRUD integrado com listagem, cadastro, alteracao e exclusao
- `clientes`: telas demonstrativas locais, ainda sem integracao GraphQL
- `system-design`: vitrine interna de componentes e padroes visuais

## CRUD de referencia

Use o CRUD de `pessoas` como baseline para novos modulos de dominio. Ele concentra o padrao atual de:

- listagem por GraphQL
- formulario unico para criar e editar
- validacao com `React Hook Form` + `Zod`
- tratamento de loading, erro, sucesso e exclusao com confirmacao
- redirecionamento de volta para a listagem apos salvar ou excluir

Arquivos de referencia:

- `app/(dashboard)/pessoas/pesquisa/page.tsx`
- `app/(dashboard)/pessoas/cadastro/page.tsx`
- `src/features/pessoas/components/person-search-view.tsx`
- `src/features/pessoas/components/person-registration-view.tsx`
- `src/features/pessoas/api/get-people.ts`
- `src/features/pessoas/api/person-upsert.ts`

## Skills locais

As skills locais ficam em `.codex/skills`:

- `front-architecture`: arquitetura e padroes gerais do front
- `auth-graphql`: fluxo oficial de autenticacao GraphQL
- `crud-front`: padrao oficial para CRUDs consistentes

## Documentacao de apoio

- `AGENTS.md`: regras de implementacao, validacao e colaboracao neste repositorio
- `.codex/skills/front-architecture/SKILL.md`: arquitetura oficial do front
- `.codex/skills/auth-graphql/SKILL.md`: autenticacao GraphQL oficial
- `.codex/skills/crud-front/SKILL.md`: guia de CRUD padronizado

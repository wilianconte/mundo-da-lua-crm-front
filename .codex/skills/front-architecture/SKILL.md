---
name: dev-admin
description: Enforce the official front-end architecture for Mundo da Lua CRM. Use when working on the CRM front-end, proposing UI architecture, creating screens or components, structuring Next.js code, defining GraphQL integration, or reviewing whether a front-end change follows the project's required standards for Next.js, App Router, Tailwind CSS, GraphQL, accessibility, responsiveness, and performance.
---

# Dev Admin

Use esta skill como guia padrao de implementacao para o front-end do Mundo da Lua CRM.

## Quando usar

- criar ou alterar estrutura de features, rotas e componentes no front
- revisar conformidade arquitetural (Next.js, App Router, GraphQL, acessibilidade, performance)
- decidir padrao de organizacao entre camadas e modulos

## Quando nao usar

- tarefa estritamente de autenticacao/sessao sem mudanca arquitetural (usar `mundo-da-lua-auth-graphql`)
- tarefa estritamente de fluxo CRUD sem mudanca estrutural (usar `crud-front`)

## Dependencias com outras skills

- usar junto com `crud-front` quando houver listagem/cadastro/edicao/exclusao
- usar junto com `mundo-da-lua-auth-graphql` quando houver rotas autenticadas ou token

## Quick Start

1. Ler `references/dev-admin.md` antes de decisoes arquiteturais ou estruturais.
2. Tratar a referencia como fonte de verdade quando houver conflito de opiniao local.
3. Alinhar fluxos autenticados com `../auth-graphql/references/auth-graphql.md`.
4. Alinhar telas e fluxos de CRUD com `../crud-front/references/crud-front.md` quando houver listagem, create, edit ou delete.
5. Manter o trabalho alinhado com a stack oficial:
   - `Next.js`
   - `App Router`
   - `TypeScript`
   - `Tailwind CSS`
   - `GraphQL` como unica interface de dados
   - `Server Components` por padrao
   - `React Hook Form` + `Zod` para formularios
6. Preferir padroes existentes do design system em vez de criar novas convencoes visuais.

## Regras de execucao

- Usar `Server Components` por padrao; migrar para `Client Components` apenas quando houver interatividade real ou API exclusiva do browser.
- Organizar por dominio de negocio, nao apenas por camada tecnica.
- Manter operacoes GraphQL proximas da feature.
- Nao colocar GraphQL ou regras de negocio dentro de componentes genericos de `ui`.
- Tratar acessibilidade, loading, error, empty, responsividade e performance como requisitos obrigatorios.
- Evitar camadas de estado duplicadas, sistemas visuais paralelos ou bibliotecas de UI sobrepostas.

## O que verificar antes de implementar

Confirmar:

- qual modulo ou dominio de negocio sera alterado
- se a rota deve ser `Server Component` ou `Client Component`
- qual contrato GraphQL ou fragmento de schema sera usado
- se ja existe componente reutilizavel no design system
- quais regras de tenant e permissao afetam o fluxo
- quais estados de `loading`, `empty`, `error` e `success` sao necessarios
- qual sera o comportamento em mobile/tablet/desktop

## O que verificar antes de finalizar

Confirmar:

- nao foi introduzido padrao de design paralelo
- nao foi adicionado estado global desnecessario
- nao houve duplicacao de regra de negocio no front
- basicos de acessibilidade estao cobertos
- estados de loading, empty e error existem onde necessario
- estrutura da feature segue modelo orientado a dominio
- impacto de performance permanece razoavel

## Guia de referencia

Ler `references/dev-admin.md` para:

- decisoes arquiteturais obrigatorias
- estrutura de projeto e organizacao por feature
- regras de camadas de componentes
- regras de design system e UX
- comportamento responsivo
- GraphQL, auth, autorizacao e regras multi-tenant
- convencoes atuais de cliente GraphQL e sessao de auth do repositorio
- padroes de implementacao Next.js
- convencoes de codigo
- performance, acessibilidade, testes e quality gates
- anti-padroes proibidos

## Diretrizes de bootstrap

Quando iniciar um novo admin front para o Mundo da Lua CRM:

- criar o projeto em pasta dedicada de front-end e manter isolado do backend
- usar tema configuravel por tokens desde o primeiro commit
- definir no minimo `--color-primary` e `--color-secondary`, alem de surface, border, text, radius, shadow e motion tokens
- tratar o produto inicial como painel administrativo, nao site de marketing
- implementar sidebar responsiva com suporte a niveis de navegacao
- entregar login polido e home/dashboard autenticado como primeiras duas rotas
- incluir `/components` (ou equivalente) para documentar os primeiros componentes reutilizaveis
- preferir tema claro com densidade operacional, hierarquia forte e leitura rapida
- manter o shell inicial preparado para branding por tenant sem permitir deriva visual arbitraria

## Conhecimento a preservar

- o primeiro bootstrap do front-end vive em `mundo-da-lua-front`
- a paleta inicial do tema usa azul como primaria e teal como secundaria por tokens CSS
- o admin shell ja define sidebar, drawer mobile, topbar e componentes reutilizaveis (cards, buttons, inputs e badges)
- o login usa `React Hook Form` + `Zod` e redireciona para o dashboard
- dashboard home e showcase de componentes sao a base para futuras expansoes

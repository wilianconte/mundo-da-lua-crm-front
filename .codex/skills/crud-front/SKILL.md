---
name: crud-front
description: Padrao oficial para desenvolver e revisar CRUDs no Mundo da Lua CRM front. Use quando houver listagem, cadastro, alteracao, exclusao, formularios de dominio, queries/mutations GraphQL por feature, ou quando for preciso garantir consistencia entre novos CRUDs e o CRUD de pessoas.
---

# CRUD Front

Use esta skill sempre que uma feature envolver listagem, cadastro, alteracao ou exclusao.

## Quick Start

1. Ler `references/crud-front.md`.
2. Usar `src/features/pessoas/*` e `app/(dashboard)/pessoas/*` como implementacao de referencia.
3. Alinhar a estrutura geral com `../front-architecture/references/dev-admin.md`.
4. Alinhar autenticacao e sessao com `../auth-graphql/references/auth-graphql.md`.
5. Manter a feature organizada por dominio, com API, schema e components proximos.

## Regras obrigatorias

- Toda comunicacao com backend deve passar por GraphQL usando `src/lib/graphql/client.ts`.
- CRUDs autenticados devem respeitar o proxy `app/api/graphql/route.ts` e o fluxo de sessao centralizado.
- A referencia oficial atual para CRUD integrado e `pessoas`; nao usar `clientes` como baseline de producao enquanto ele permanecer demonstrativo.
- Toda listagem nova deve seguir o modelo de `src/features/pessoas/components/person-search-view.tsx` (Omnisearch tokenizado, tabela, ordenacao e paginacao) como padrao visual e de comportamento.
- Separar listagem e formulario em rotas distintas, preferindo `/pesquisa` e `/cadastro`.
- Para edicao, usar o contrato atual com query string `mode=edit&id=<uuid>` ate que o projeto defina outra convencao.
- Usar `React Hook Form` + `Zod` para formularios.
- Normalizar campos opcionais para `undefined` antes de enviar mutations.
- Mapear erros GraphQL para mensagens amigaveis perto da feature.
- Cobrir loading, empty, error, success e confirmacao de exclusao.
- Excluir apenas em modo de edicao e sempre pedir confirmacao antes da mutation destrutiva.
- Toda delecao deve ser confirmada via `src/components/ui/confirmation-dialog.tsx`; nao usar `window.confirm`, modal inline duplicada ou exclusao direta sem confirmacao.
- Em atualizacao de cadastro, exibir modal de sucesso antes de redirecionar para a listagem (padrao de UX do projeto).
- Em delecao bem-sucedida, exibir modal de sucesso antes de redirecionar para a listagem (nao redirecionar direto apos excluir).

## Estrutura recomendada

- `app/(dashboard)/<dominio>/pesquisa/page.tsx`: pagina da listagem.
- `app/(dashboard)/<dominio>/cadastro/page.tsx`: pagina de criacao/edicao.
- `src/features/<dominio>/api/*`: queries, mutations, tipos e mapeamento de erro.
- `src/features/<dominio>/schema/*`: schema `Zod` e tipos inferidos do formulario.
- `src/features/<dominio>/components/*`: views da listagem e do formulario.

## Antes de finalizar

- confirmar que a listagem oferece CTA claro para novo cadastro e entrada para edicao
- confirmar que a tela de cadastro suporta criacao e alteracao sem duplicar formulario
- confirmar que a exclusao so aparece em edicao e pede confirmacao
- confirmar que o sucesso redireciona para a listagem
- confirmar que filtros, ordenacao, loading, empty e error existem onde fizer sentido
- confirmar que a feature nao copiou logica de negocio para `components/ui`

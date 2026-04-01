# Frontend Audit Report

Data da auditoria: 2026-03-31

## Atualizacao de resolucao

Data da resolucao: 2026-03-31

- Achado critico **"Build e typecheck do projeto estao quebrados"**: **RESOLVIDO**.
- Correcoes aplicadas:
  - `src/components/layout/sidebar-nav.tsx`: removido retorno com `null` nos filtros, usando acumulacao tipada (`reduce`) compativel com `NavItem[]` e `NavChildItem[]`.
  - `src/features/auth/components/sign-up-form.tsx`: `defaultValues.companyType` alinhado para `undefined` (tipo transformado do schema).
  - `src/features/grupos/components/group-registration-view.tsx`: estreitamento explicito de `roleId` antes de `getRoleById`, `updateRole` e `deleteRole`.
- Validacoes apos ajuste:
  - `node node_modules/typescript/bin/tsc --noEmit`: **sucesso**.
  - `next build`: **sucesso**.

## Resumo executivo

O front evoluiu desde o levantamento anterior. Tres achados antigos nao se sustentam mais no codigo atual:

- `proxy.ts` agora existe e faz gate server-side de sessao.
- `npm run lint` nao esta mais quebrado por script invalido; ele falha por um warning real.
- `usuarios` ja implementa create, update e delete com GraphQL.

Mesmo assim, o projeto ainda tem riscos relevantes em quatro frentes:

1. a esteira local de qualidade esta quebrada: `lint`, `tsc` e `build` falham;
2. autorizacao continua dependente do cliente e falha aberta quando permissoes nao carregam;
3. alguns CRUDs persistem dados em varias mutacoes sem rollback, abrindo espaco para estado parcial;
4. `alunos` ainda mistura naming de mock, compatibilidades temporarias, N+1 e reuso compartilhado no dominio errado.

Em paralelo, seguem ativos problemas de padrao e consolidacao: modais repetidos, token semantico de erro ausente, fluxo publico de `criar-conta`/`esqueci-senha` apenas simulado, `clientes` ainda demonstrativo dentro da arvore principal e documentacao bootstrap desalinhada com a arquitetura atual.

## Visao geral da arquitetura atual

- `app/` esta bem usado como camada de rotas finas; as `page.tsx` apenas compoem as views da feature.
- O caminho oficial de dados esta correto: browser -> `app/api/graphql/route.ts` -> backend GraphQL, com `src/lib/graphql/client.ts` centralizando auth, refresh token e tratamento de erro.
- A sessao segue o padrao novo do projeto: `localStorage`, sincronizacao de cookies `httpOnly` via `app/api/auth/session/route.ts` e assinatura em `src/lib/auth/server-session-signature.ts`.
- `proxy.ts` ja protege a area privada por sessao valida, mas ainda nao aplica autorizacao por permissao no request.
- `src/features/pessoas`, `src/features/cursos`, `src/features/empresas`, `src/features/usuarios` e `src/features/grupos` ja estao integrados por GraphQL.
- `src/features/alunos` ainda esta em estado hibrido: usa GraphQL real, mas mantem naming, tipos e trechos de compatibilidade herdados de uma fase mock.
- `src/features/shared/components` ja consolidou reuso real para busca (`TokenizedSearchFilters`, `SearchResultsTable`, `EntityAutocomplete`), mas `clientes` e parte de `alunos` ainda seguem patterns paralelos.
- A maior parte das telas operacionais continua client-first: as rotas App Router sao wrappers server-side de views `"use client"` que carregam dados em `useEffect`.

## Achados por severidade

### Critico

#### 1. Build e typecheck do projeto estao quebrados

- Severidade: `critico`
- Categoria: `bug`
- Titulo curto: Build bloqueado por erros de tipagem em navegacao, auth publica e grupos
- Descricao objetiva: o repositorio nao passa em `npx tsc --noEmit` nem em `npm run build`. O erro principal esta em `sidebar-nav`, mas ha tambem erro de tipagem no `sign-up-form` e em `group-registration-view`.
- Evidencia:
  - `src/components/layout/sidebar-nav.tsx:31-53`
  - `src/components/layout/sidebar-nav.tsx:59-80`
  - `src/features/auth/components/sign-up-form.tsx:79-110`
  - `src/features/grupos/components/group-registration-view.tsx:180-190`
  - Validacao local: `npx tsc --noEmit`
  - Validacao local: `npm run build`
- Impacto tecnico e/ou funcional:
  - o build de producao nao conclui;
  - qualquer deploy fica bloqueado;
  - erros de tipagem basicos deixam de ser uma rede minima de seguranca.
- Recomendacao pratica:
  - corrigir primeiro `sidebar-nav` para remover `null` do retorno inferido e ajustar os predicates;
  - alinhar o `defaultValues.companyType` do `sign-up-form` com o tipo transformado do schema;
  - estreitar `roleId` antes do `getRoleById` no `group-registration-view`.
- Sugestao de generalizacao/reuso:
  - adicionar `typecheck` explicito em `package.json` e usa-lo como validacao obrigatoria antes de merge.

### Alto

#### 2. Autorizacao de rota continua client-side e falha aberta quando permissoes nao carregam

- Severidade: `alto`
- Categoria: `arquitetura`
- Titulo curto: Gate server-side valida sessao, mas nao autorizacao
- Descricao objetiva: `proxy.ts` so valida sessao. A autorizacao por permissao acontece no cliente em `DashboardAuthGuard`, e quando a carga de permissoes falha ou volta vazia o componente simplesmente mantem a rota aberta.
- Evidencia:
  - `proxy.ts:85-98`
  - `src/features/auth/components/dashboard-auth-guard.tsx:34-63`
  - `src/components/layout/sidebar-nav.tsx:299-310`
- Impacto tecnico e/ou funcional:
  - a rota privada ja chega a ser renderizada antes do redirect por permissao;
  - se `myPermissions` falhar, o guard nao bloqueia a rota;
  - a navegacao inicialmente cai em `navigationItems` completos antes do filtro por permissao.
- Recomendacao pratica:
  - mover o gate de permissao para uma camada server-side confiavel, ou propagar claims/permissoes assinadas para o request;
  - no cliente, falhar fechado enquanto permissoes nao estiverem resolvidas;
  - evitar renderizar o menu completo antes da permissao estar carregada.
- Sugestao de generalizacao/reuso:
  - consolidar um unico auth/permission gate para App Router, em vez de separar sessao no servidor e autorizacao no cliente.

#### 3. Endereco de empresa ficou obrigatorio por acidente, contrariando a UX da propria tela

- Severidade: `alto`
- Categoria: `bug`
- Titulo curto: `country: "BR"` transforma endereco opcional em obrigatorio
- Descricao objetiva: o formulario de empresa inicia `country` com `"BR"`. Como o schema considera qualquer valor de endereco como sinal de que o bloco foi preenchido, isso torna rua, bairro, cidade, UF e CEP obrigatorios mesmo quando a tela descreve o endereco como opcional.
- Evidencia:
  - `src/features/empresas/components/company-registration-view.tsx:93-120`
  - `src/features/empresas/components/company-registration-view.tsx:221-235`
  - `src/features/empresas/components/company-registration-view.tsx:553-559`
  - `src/features/empresas/schema/company-registration-schema.ts:53-86`
- Impacto tecnico e/ou funcional:
  - a UX real contradiz a descricao da aba;
  - o cadastro de empresa pode falhar sem que o usuario espere que endereco seja obrigatorio;
  - o contrato de persistencia fica ambiguo entre schema e `persistAddress`.
- Recomendacao pratica:
  - definir `country` vazio por padrao e preencher `BR` apenas quando o usuario iniciar o bloco;
  - ou tornar o endereco realmente obrigatorio na copia e no comportamento da tela, se essa for a regra de negocio desejada.
- Sugestao de generalizacao/reuso:
  - criar um helper compartilhado para blocos de endereco opcionais, evitando repetir refinements e defaults inconsistentes.

#### 4. Empresas, grupos e alunos persistem dados em varias mutacoes sem rollback

- Severidade: `alto`
- Categoria: `bug`
- Titulo curto: Fluxos multi-etapa deixam estado parcial no backend em caso de falha intermediaria
- Descricao objetiva: alguns cadastros criam/atualizam a entidade principal e depois executam mutacoes adicionais para endereco, permissoes, cursos e responsaveis. Se a segunda etapa falhar, o front deixa o registro parcialmente salvo.
- Evidencia:
  - `src/features/empresas/components/company-registration-view.tsx:221-279`
  - `src/features/grupos/components/group-registration-view.tsx:274-295`
  - `src/features/alunos/api/student-mock-service.ts:1111-1162`
  - `src/features/alunos/api/student-mock-service.ts:1189-1254`
- Impacto tecnico e/ou funcional:
  - empresa pode ser criada/atualizada sem endereco;
  - grupo pode ser salvo sem o conjunto final de permissoes;
  - aluno pode ficar com parte das matriculas/responsaveis aplicada e parte nao.
- Recomendacao pratica:
  - preferir uma mutacao orquestradora unica por dominio quando o backend suportar;
  - se isso ainda nao existir, implementar compensacao explicita ou UX de erro que informe o estado parcial e permita reconciliacao segura.
- Sugestao de generalizacao/reuso:
  - padronizar um pequeno orquestrador por feature para fluxos multi-etapa, com retorno padronizado de erro parcial.

#### 5. `alunos` ainda mistura mock, GraphQL real, compatibilidade e N+1 na mesma camada

- Severidade: `alto`
- Categoria: `arquitetura`
- Titulo curto: Dominio de alunos segue hibrido e caro de manter
- Descricao objetiva: `student-mock-service.ts` continua nomeado e tipado como mock, mas executa queries/mutations reais, mantem arrays mock locais, compatibilidades temporarias e ainda faz composicao de dados com multiplas chamadas adicionais por registro.
- Evidencia:
  - `src/features/alunos/api/student-mock-service.ts:19-32`
  - `src/features/alunos/api/student-mock-service.ts:119-139`
  - `src/features/alunos/api/student-mock-service.ts:258-305`
  - `src/features/alunos/api/student-mock-service.ts:866-903`
  - `src/features/alunos/api/student-mock-service.ts:1038-1099`
  - `src/features/alunos/components/student-registration-view.tsx:13-25`
  - `src/features/alunos/components/student-registration-view.tsx:39-45`
  - `src/features/alunos/components/student-registration-view.tsx:441-462`
- Impacto tecnico e/ou funcional:
  - aumenta risco de regressao ao misturar contratos temporarios e definitivos;
  - encarece manutencao, leitura e teste;
  - `getStudentById` faz N+1 para pessoas e cursos vinculados;
  - o naming engana sobre o estado real da integracao.
- Recomendacao pratica:
  - quebrar a feature em `types`, `queries`, `mutations`, `mappers` e `compat`;
  - remover arrays e naming `Mock*` da camada produtiva;
  - reduzir N+1 puxando dados relacionados em consultas mais adequadas ou batch.
- Sugestao de generalizacao/reuso:
  - extrair view-models neutros de selecao e leitura detalhada para `shared` ou para os dominios corretos (`pessoas` e `cursos`), nao para `alunos`.

### Medio

#### 6. Fluxos publicos de `criar-conta` e `esqueci-senha` seguem simulados e fora do padrao oficial

- Severidade: `medio`
- Categoria: `padrao`
- Titulo curto: Auth publica secundaria ainda nao conversa com GraphQL
- Descricao objetiva: `sign-up` e `forgot-password` apenas simulam sucesso local com `setTimeout`. Alem disso, `sign-up` e o botao de Google no login expoem copy de placeholder em rotas publicas reais.
- Evidencia:
  - `src/features/auth/components/sign-up-form.tsx:109-118`
  - `src/features/auth/components/sign-up-form.tsx:492-505`
  - `src/features/auth/components/forgot-password-form.tsx:31-37`
  - `src/features/auth/components/login-form.tsx:88-90`
- Impacto tecnico e/ou funcional:
  - o usuario acessa rotas que parecem prontas, mas nao executam fluxo real;
  - o frontend foge do padrao oficial de comunicacao exclusiva por GraphQL;
  - o warning de `watch()` em `sign-up-form` hoje derruba o `lint`.
- Recomendacao pratica:
  - esconder ou marcar explicitamente essas rotas como indisponiveis ate existir contrato real;
  - quando o backend estiver pronto, integrar pelo caminho oficial de GraphQL.
- Sugestao de generalizacao/reuso:
  - padronizar um status de feature alpha/placeholder para rotas publicas ainda nao integradas.

#### 7. App Router esta sendo usado com paginas server-thin e carregamento majoritariamente client-side

- Severidade: `medio`
- Categoria: `performance`
- Titulo curto: CRUDs principais continuam client-first
- Descricao objetiva: as rotas do dashboard sao server components finos, mas as views operacionais sao quase todas `"use client"` e fazem a primeira busca em `useEffect`, inclusive listagens e telas de edicao.
- Evidencia:
  - `app/(dashboard)/pessoas/pesquisa/page.tsx:1-4`
  - `src/features/pessoas/components/person-search-view.tsx:1`
  - `src/features/pessoas/components/person-search-view.tsx:280-331`
  - `app/(dashboard)/usuarios/pesquisa/page.tsx:1-4`
  - `src/features/usuarios/components/user-search-view.tsx:1`
  - `src/features/usuarios/components/user-search-view.tsx:204-256`
  - `src/features/empresas/components/company-search-view.tsx:155-273`
  - `src/features/cursos/components/course-search-view.tsx:165-257`
  - `src/features/grupos/components/group-search-view.tsx:103-217`
- Impacto tecnico e/ou funcional:
  - mais JS hidratado do que o necessario;
  - primeira carga depende do cliente para dados que poderiam ser resolvidos antes;
  - o projeto fica menos alinhado ao padrao server-first definido localmente.
- Recomendacao pratica:
  - migrar a carga inicial das listagens e dos detalhes de edicao para server components gradualmente;
  - deixar no cliente apenas filtros, interacoes densas e formulacao local.
- Sugestao de generalizacao/reuso:
  - criar um baseline de page server-first para listagem e edicao, reaproveitavel nos CRUDs integrados.

#### 8. Reuso real de pessoas ficou enterrado em `alunos` e vazou para `usuarios`

- Severidade: `medio`
- Categoria: `reuso`
- Titulo curto: Lookup compartilhado esta no dominio errado
- Descricao objetiva: `usuarios` depende de `PersonAutocomplete`, `PersonSearchModal`, `getStudentPersonById` e `MockPerson` vindos de `alunos`, embora o dado de origem seja `pessoas`.
- Evidencia:
  - `src/features/usuarios/components/user-registration-view.tsx:13-16`
  - `src/features/usuarios/components/user-registration-view.tsx:42-43`
  - `src/features/usuarios/components/user-registration-view.tsx:217-221`
  - `src/features/alunos/api/search-student-people.ts:1-2`
  - `src/features/alunos/api/search-student-people.ts:89-123`
  - `src/features/alunos/components/person-autocomplete.tsx:3-5`
- Impacto tecnico e/ou funcional:
  - cria dependencia errada entre dominios;
  - transforma `alunos` em pseudo-shared;
  - dificulta evolucao independente de `usuarios` e `pessoas`.
- Recomendacao pratica:
  - mover o lookup de pessoa para `src/features/shared` ou `src/features/pessoas`;
  - trocar `MockPerson` por um view-model neutro de selecao.
- Sugestao de generalizacao/reuso:
  - o mesmo vale para o lookup de cursos, que hoje tambem esta encapsulado sob `alunos`.

#### 9. `SearchResultsTable` continua exibindo menu contextual com acoes fantasmas

- Severidade: `medio`
- Categoria: `bug`
- Titulo curto: Menu sugere capacidades que nao existem
- Descricao objetiva: o contexto da tabela lista acoes como classificar coluna inteira, agrupar e IA, mas o click real so trata `hide-column` quando disponivel. O restante apenas fecha o menu.
- Evidencia:
  - `src/features/shared/components/search-results-table.tsx:160-170`
  - `src/features/shared/components/search-results-table.tsx:354-374`
- Impacto tecnico e/ou funcional:
  - cria expectativa falsa de funcionalidade pronta;
  - diminui confianca no componente compartilhado;
  - eleva ruido de manutencao em todas as listagens que o reutilizam.
- Recomendacao pratica:
  - remover itens nao implementados ou implementar comportamento real;
  - deixar o menu extensivel por props para cada listagem registrar apenas acoes suportadas.
- Sugestao de generalizacao/reuso:
  - transformar o contexto de coluna em API configuravel, nao em lista fixa de placeholders.

#### 10. O tema nao define `--color-danger-strong`, mas o token e usado em varios fluxos

- Severidade: `medio`
- Categoria: `padrao`
- Titulo curto: Token semantico de erro esta ausente da base visual
- Descricao objetiva: o design system referencia `--color-danger-strong` em botoes, erros de formulario e mensagens de busca, mas `app/globals.css` nao define esse token.
- Evidencia:
  - `app/globals.css:3-35`
  - `src/components/ui/button.tsx:24`
  - `src/features/pessoas/components/person-search-view.tsx:571`
  - `src/features/empresas/components/company-registration-view.tsx:370-643`
- Impacto tecnico e/ou funcional:
  - a cor de erro passa a depender de fallback do browser ou de combinacoes acidentais;
  - o sistema de tokens perde previsibilidade para estados semanticos.
- Recomendacao pratica:
  - definir ao menos `danger/destructive` completo no tema base;
  - alinhar naming dos variants e tokens semanticos.
- Sugestao de generalizacao/reuso:
  - fechar um conjunto minimo de feedback tokens antes de extrair mais components.

#### 11. Dialogs estao duplicados e com semantica acessivel inconsistente

- Severidade: `medio`
- Categoria: `acessibilidade`
- Titulo curto: Modais repetidos sem primitive comum e com diferencas de a11y
- Descricao objetiva: varias features montam modais manualmente. Algumas usam `role="dialog"` e `aria-live`; outras nem isso possuem, e nenhuma centraliza foco, Escape ou `aria-modal`.
- Evidencia:
  - `src/features/pessoas/components/person-registration-view.tsx:532-589`
  - `src/features/cursos/components/course-registration-view.tsx:430-487`
  - `src/features/usuarios/components/user-registration-view.tsx:516-570`
  - `src/features/grupos/components/group-registration-view.tsx:583-634`
  - `src/features/alunos/components/guardians-editor.tsx:313-346`
  - `src/features/alunos/components/student-registration-view.tsx:775-853`
  - `src/features/empresas/components/company-registration-view.tsx:657-679`
- Impacto tecnico e/ou funcional:
  - comportamento desigual de teclado e leitores de tela;
  - correcoes de estilo/comportamento precisam ser repetidas em varios pontos;
  - regressao visual e de acessibilidade fica mais provavel.
- Recomendacao pratica:
  - extrair um `Dialog` base em `src/components/ui` ou `src/components/feedback`;
  - padronizar `role`, `aria-modal`, titulo associado, foco inicial e fechamento por teclado.
- Sugestao de generalizacao/reuso:
  - este e o melhor candidato atual de consolidacao imediata no front.

#### 12. `clientes` segue como CRUD paralelo demonstrativo dentro da estrutura produtiva

- Severidade: `medio`
- Categoria: `manutenibilidade`
- Titulo curto: Modulo demonstrativo ainda parece baseline de produto
- Descricao objetiva: `clientes` permanece com dataset local, filtro local, submit demonstrativo e `console.log`, mas vive na mesma estrutura de dominio dos CRUDs reais.
- Evidencia:
  - `README.md:80`
  - `src/features/clientes/components/client-search-view.tsx:59-92`
  - `src/features/clientes/components/client-search-view.tsx:130-158`
  - `src/features/clientes/components/client-search-view.tsx:232-460`
  - `src/features/clientes/components/client-registration-view.tsx:40-43`
  - `src/features/clientes/components/client-registration-view.tsx:62-67`
- Impacto tecnico e/ou funcional:
  - aumenta custo cognitivo para onboarding;
  - reforca um baseline errado para novos CRUDs;
  - mantem codigo demonstrativo dentro da superficie operacional do produto.
- Recomendacao pratica:
  - isolar visualmente/estruturalmente `clientes` como demonstrativo;
  - ou evoluir o modulo para o padrao oficial antes de mantelo na mesma arvore de features.
- Sugestao de generalizacao/reuso:
  - antes de qualquer extracao, migrar `clientes` para `TokenizedSearchFilters` e `SearchResultsTable` ou assumir explicitamente que ele nao e baseline.

#### 13. Documentacao e textos de bootstrap ainda contradizem a arquitetura vigente

- Severidade: `medio`
- Categoria: `padrao`
- Titulo curto: README e dashboard ainda falam de uma arquitetura que ja mudou
- Descricao objetiva: o README ainda afirma ausencia de refresh token e lista apenas tres chaves de sessao. A home do dashboard ainda manda definir cookie seguro e escolher entre Apollo e urql, apesar de o projeto ja ter decisoes oficiais implementadas.
- Evidencia:
  - `README.md:41-47`
  - `src/lib/auth/session.ts:47-52`
  - `src/lib/graphql/client.ts:99-151`
  - `proxy.ts:85-98`
  - `src/features/dashboard/components/home-overview.tsx:161-174`
- Impacto tecnico e/ou funcional:
  - onboarding recebe instrucoes conflitantes;
  - aumenta risco de reintroduzir uma segunda camada de GraphQL ou um fluxo paralelo de auth.
- Recomendacao pratica:
  - alinhar README e textos de bootstrap ao estado atual do projeto;
  - remover mensagens de decisao ja encerrada.
- Sugestao de generalizacao/reuso:
  - manter `AGENTS.md` e skills como fonte de verdade e referenciar isso explicitamente na documentacao do repo.

### Baixo

#### 14. A esteira de qualidade minima ainda e curta para o porte do front

- Severidade: `baixo`
- Categoria: `teste`
- Titulo curto: Nao ha script explicito de typecheck/teste nem footprint de `tests/` ou `stories/`
- Descricao objetiva: `package.json` expoe apenas `dev`, `build`, `start` e `lint`. O repositorio tambem nao possui `tests/` nem `stories/`, embora a arquitetura local cite Storybook e uma base de testes.
- Evidencia:
  - `package.json:5-10`
  - `README.md:22-33`
  - verificacao local: `Test-Path tests` => `False`
  - verificacao local: `Test-Path stories` => `False`
- Impacto tecnico e/ou funcional:
  - gaps de regressao ficam mais dependentes de revisao manual;
  - o build quebrado demorou a aparecer apenas na hora de rodar `tsc/build`.
- Recomendacao pratica:
  - adicionar `typecheck` em `package.json`;
  - definir ao menos uma base minima para testes de schema/utilitarios e fluxos criticos.
- Sugestao de generalizacao/reuso:
  - consolidar uma esteira basica unica para todos os dominios integrados.

## Tabela de duplicacoes e oportunidades de generalizacao de componentes

| Tema | Evidencias | Oportunidade | Prioridade |
|---|---|---|---|
| Primitive de dialog/modal | `person-registration`, `course-registration`, `company-registration`, `user-registration`, `group-registration`, `student-registration`, `guardians-editor` | Extrair `Dialog`, `DialogHeader`, `DialogBody`, `DialogFooter` e regras de foco/teclado | Alta |
| Lookup compartilhado de pessoas | `user-registration`, `guardians-editor`, `student-registration`, `search-student-people`, `person-autocomplete` | Mover para `shared` ou `pessoas` com tipo neutro de selecao | Alta |
| Lookup compartilhado de cursos | `student-registration`, `course-autocomplete`, `search-student-courses` | Criar modulo neutro de selecao de cursos fora de `alunos` | Media |
| Shell de CRUD tabulado | `company-registration`, `course-registration`, `user-registration`, `group-registration`, `student-registration` | Extrair composicao de header + tabs laterais + feedback apos estabilizar comportamento | Media |
| Mascaras e normalizacao | `person-registration`, `company-registration`, `sign-up-form` | Centralizar `maskPhone`, `maskCpf`, `maskCnpj`, `maskZipCode` e `normalizeOptional` | Media |
| Scaffold de busca | `pessoas`, `empresas`, `cursos`, `usuarios`, `grupos`, `alunos` ja usam shared; `clientes` continua fora | Migrar `clientes` para `TokenizedSearchFilters` e `SearchResultsTable` ou isolalo como demonstrativo | Media |

## Quick wins

- Corrigir os 6 erros de `tsc` para destravar `build`.
- Fazer o guard de permissao falhar fechado quando `myPermissions` nao carregar.
- Remover o default `country: "BR"` do estado inicial de empresa ou assumir endereco como obrigatorio de ponta a ponta.
- Trocar `watch()` por `useWatch()` em `sign-up-form` para restaurar `npm run lint`.
- Definir `--color-danger-strong` em `app/globals.css`.
- Remover ou desabilitar itens nao implementados do menu contextual de `SearchResultsTable`.
- Extrair um primitive de modal/dialog e migrar primeiro `empresas`, `alunos` e `usuarios`.
- Tirar `clientes` da superficie de referencia do produto enquanto ele seguir local/demonstrativo.
- Atualizar `README.md` e os cards de bootstrap da home.

## Validacoes executadas

- Leitura de `AGENTS.md` e das referencias locais:
  - `.codex/skills/front-architecture/references/dev-admin.md`
  - `.codex/skills/auth-graphql/references/auth-graphql.md`
  - `.codex/skills/crud-front/references/crud-front.md`
- Inspecao manual de:
  - `app/`
  - `src/`
  - `package.json`
  - `README.md`
  - `proxy.ts`
  - `src/lib/auth/*`
  - `src/lib/graphql/client.ts`
  - features `pessoas`, `clientes`, `empresas`, `usuarios`, `alunos`, `cursos`, `grupos`, `auth`, `shared`
- Execucao de `npm run lint`
  - Resultado: falhou por 1 warning tratado como erro.
  - Evidencia principal:
    - `src/features/auth/components/sign-up-form.tsx:109`
    - regra `react-hooks/incompatible-library`
- Execucao de `npx tsc --noEmit`
  - Resultado: falhou com 6 erros.
  - Principais arquivos:
    - `src/components/layout/sidebar-nav.tsx`
    - `src/features/auth/components/sign-up-form.tsx`
    - `src/features/grupos/components/group-registration-view.tsx`
- Execucao de `npm run build`
  - Resultado: compilacao Turbopack passou, mas o build falhou na etapa de typecheck pelos mesmos erros do `tsc`.
  - Observacao adicional:
    - `next.config.ts` tambem gerou warning deprecado do Sentry para `disableLogger`.
- Verificacoes estruturais:
  - `tests/`: ausente
  - `stories/`: ausente
  - `proxy.ts`: presente
  - `middleware.ts`: ausente, o que esta correto para o padrao atual do projeto

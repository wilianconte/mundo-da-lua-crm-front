# Frontend Audit Report

Data da auditoria: 2026-03-31

## Resumo executivo

O projeto tem uma base arquitetural promissora: `Next.js` com `App Router`, uma camada oficial de GraphQL (`src/lib/graphql/client.ts` + `app/api/graphql/route.ts`), tokens centrais em `app/globals.css` e alguns composites reutilizaveis ja consolidados, como `FeatureViewHeader`, `TokenizedSearchFilters`, `SearchResultsTable` e `EntityAutocomplete`.

O principal problema hoje nao e a ausencia de padrao, e sim a coexistencia de tres estados de maturidade no mesmo front:

- fluxos integrados e relativamente maduros, como `pessoas`
- fluxos parcialmente integrados, como `usuarios`, `alunos`, `cursos` e `empresas`
- fluxos claramente demonstrativos ou placeholder convivendo no produto, como `clientes`, `/components` e varios itens de navegacao

Os riscos mais relevantes para atuacao futura sao:

- protecao da area autenticada ainda dependente de cliente
- CRUD de usuarios exposto com comportamento incompleto
- acoplamento excessivo e nomenclatura enganosa no modulo de `alunos`
- pipeline de validacao quebrado
- duplicacao de modais, lookups e shells de CRUD sem uma consolidacao controlada

## Visao geral da arquitetura atual

- `app/` esta sendo usado corretamente como camada de rotas e layouts.
- `src/features/` concentra comportamento por dominio, mas ainda existem vazamentos entre dominios.
- `src/components/ui/` tem primitives simples e consistentes.
- `src/features/shared/components/` ja concentra parte do reuso real de busca, tabela e autocomplete.
- `pessoas` e a referencia mais consistente de CRUD integrado.
- `usuarios` e `alunos` ainda misturam partes de producao com adaptacoes temporarias e componentes emprestados.
- Nao existe `middleware.ts`; a area privada depende de `DashboardAuthGuard`.
- Nao ha `tests/`, `stories/` ou scripts ativos de teste automatizado no repositorio.

## Achados por severidade

### Alto

#### 1. Protecao da area autenticada depende de guard client-side

- Severidade: `alto`
- Categoria: `arquitetura`
- Titulo: Protecao de rota privada ocorre apenas no cliente
- Descricao: o layout autenticado envolve todo o dashboard com `DashboardAuthGuard`, que valida sessao apenas via `localStorage` em `useEffect`.
- Evidencia:
  - `app/(dashboard)/layout.tsx:1-12`
  - `src/features/auth/components/dashboard-auth-guard.tsx:12-36`
  - nenhum `middleware.ts` encontrado no repositorio
- Impacto:
  - a protecao nao acontece na borda nem no servidor
  - a UX inicial depende de hidratacao e pode gerar tela vazia antes do redirect
  - qualquer futura pagina server-first dentro do dashboard fica sem uma barreira real de acesso no request
- Recomendacao:
  - introduzir protecao de rota em `middleware.ts` ou outra camada server-side oficial
  - manter o guard client-side apenas como reforco de UX, nao como mecanismo primario
- Sugestao de generalizacao/reuso:
  - criar uma estrategia unica de auth gate para App Router, em vez de cada rota depender de checagem local

#### 2. CRUD de usuarios esta exposto com comportamento incompleto e perda funcional de dados

- Severidade: `alto`
- Categoria: `bug`
- Titulo: tela de usuarios promete create/edit/delete/grupos, mas implementa apenas create parcial
- Descricao: a UI de `usuarios` exibe abas, estado ativo, grupos e fluxo de edicao, mas o submit so cria usuario, nao envia `groups`, nao envia `isActive`, nao atualiza e nao exclui.
- Evidencia:
  - `src/features/usuarios/components/user-registration-view.tsx:195-205`
  - `src/features/usuarios/components/user-registration-view.tsx:212-219`
  - `src/features/usuarios/components/user-registration-view.tsx:377-410`
  - `src/features/usuarios/api/user-upsert.ts:31-45`
  - `src/features/usuarios/schema/user-registration-schema.ts:11-23`
  - `src/features/usuarios/api/get-user-by-id.ts:3-15`
- Impacto:
  - a tela induz o usuario a configurar grupos e estado ativo que nao sao persistidos
  - a rota de edicao existe, mas retorna mensagem de indisponibilidade
  - a acao de exclusao existe na UI, mas nao executa nada
- Recomendacao:
  - reduzir a superficie da tela para o que o backend suporta hoje, ou completar o contrato do CRUD de usuarios
  - remover da UI os campos/abas nao persistidos ate haver suporte real
- Sugestao de generalizacao/reuso:
  - aplicar o mesmo shell de CRUD usado em `pessoas` apenas quando create/edit/delete estiverem realmente disponiveis

#### 3. `student-mock-service.ts` mistura mock, compatibilidade e producao na mesma unidade

- Severidade: `alto`
- Categoria: `arquitetura`
- Titulo: modulo de alunos tem fronteira de dominio confusa e nome enganoso
- Descricao: `src/features/alunos/api/student-mock-service.ts` concentra tipos `Mock*`, arrays mock, mapeamentos temporarios, fallbacks de compatibilidade e chamadas GraphQL reais para leitura/escrita.
- Evidencia:
  - `src/features/alunos/api/student-mock-service.ts:1-5`
  - `src/features/alunos/api/student-mock-service.ts:19-60`
  - `src/features/alunos/api/student-mock-service.ts:119-139`
  - `src/features/alunos/api/student-mock-service.ts:798-1260`
  - `src/features/alunos/components/student-search-view.tsx:9-20`
- Impacto:
  - aumenta custo de manutencao e teste
  - mascara o que e fluxo real vs. temporario
  - facilita vazamento de tipos e componentes de `alunos` para outras features
- Recomendacao:
  - separar `types`, `queries`, `mutations`, `mappers` e eventuais `fallbacks` em arquivos distintos
  - renomear a camada para refletir o estado real da integracao quando a reorganizacao acontecer
- Sugestao de generalizacao/reuso:
  - reaproveitar apenas os tipos/view-models realmente compartilhaveis; mocks nao devem ser a linguagem comum do produto

### Medio

#### 4. Pipeline de validacao local esta quebrado e o repositorio esta sem trilha automatizada minima

- Severidade: `medio`
- Categoria: `teste`
- Titulo: `npm run lint` nao funciona e nao ha base de testes/catalogo prometida pela arquitetura
- Descricao: o script de lint configurado no projeto nao executa no ambiente atual, e o repositorio nao possui `tests/` nem `stories/`.
- Evidencia:
  - `package.json:10`
  - `README.md:24-33`
  - execucao local: `npm run lint` retornou `Invalid project directory provided ... front\\lint`
  - `Test-Path tests` => `False`
  - `Test-Path stories` => `False`
- Impacto:
  - o principal comando de validacao documentado falha
  - regressao arquitetural e de UX passa sem rede minima de seguranca
- Recomendacao:
  - corrigir o script oficial de lint
  - definir uma esteira minima com lint funcional e ao menos testes para utilitarios, schemas e fluxos criticos
- Sugestao de generalizacao/reuso:
  - usar uma base unica de validacao para todos os dominios, em vez de depender de checagem manual por feature

#### 5. Modais e dialogs foram duplicados em varias features sem primitive acessivel comum

- Severidade: `medio`
- Categoria: `acessibilidade`
- Titulo: dialogs ad hoc repetidos sem foco, `aria-modal` e comportamento consistente
- Descricao: confirmacoes, sucesso e buscas avancadas foram implementados manualmente em varias telas, com markup semelhante e sem primitive central.
- Evidencia:
  - `src/features/pessoas/components/person-registration-view.tsx:532-589`
  - `src/features/cursos/components/course-registration-view.tsx:430-487`
  - `src/features/empresas/components/company-registration-view.tsx:657-680`
  - `src/features/alunos/components/person-search-modal.tsx:165-274`
  - `src/features/alunos/components/student-registration-view.tsx:856-944`
- Impacto:
  - comportamento inconsistente entre modulos
  - risco de falhas de teclado, foco e leitores de tela
  - custo alto de manutencao para ajustes visuais/comportamentais
- Recomendacao:
  - extrair um primitive de `Dialog/Modal` em `src/components/ui` ou `src/components/feedback`
  - padronizar `aria-modal`, titulo associado, gerenciamento de foco, Escape e overlay
- Sugestao de generalizacao/reuso:
  - esse e o melhor ponto de consolidacao imediata no front hoje

#### 6. `SearchResultsTable` exibe um menu contextual com acoes fantasmas

- Severidade: `medio`
- Categoria: `bug`
- Titulo: menu contextual sugere capacidades que nao existem
- Descricao: o menu da tabela mostra acoes como classificar, agrupar, mover coluna e IA, mas o click efetivamente so executa `hide-column` quando disponivel; o restante apenas fecha o menu.
- Evidencia:
  - `src/features/shared/components/search-results-table.tsx:160-169`
  - `src/features/shared/components/search-results-table.tsx:369-374`
- Impacto:
  - cria falsa expectativa para o usuario
  - aumenta a sensacao de produto incompleto
  - dificulta confiar no comportamento do componente compartilhado
- Recomendacao:
  - remover itens nao implementados ou implementar o comportamento real
  - expor no componente apenas capacidades que cada tela de fato suporta
- Sugestao de generalizacao/reuso:
  - transformar o menu em extensivel por props, para cada feature registrar apenas as acoes reais

#### 7. Token de erro usado pelo front nao existe no tema

- Severidade: `medio`
- Categoria: `padrao`
- Titulo: `--color-danger-strong` e usado em varias telas, mas nao e definido em `globals.css`
- Descricao: o design system usa uma cor sem token correspondente, o que quebra a previsibilidade dos estados de erro.
- Evidencia:
  - `app/globals.css:3-35`
  - `src/components/ui/button.tsx:23-25`
  - `src/features/pessoas/components/person-search-view.tsx:571`
  - `src/features/empresas/components/company-registration-view.tsx:370`
  - `src/features/usuarios/components/user-search-view.tsx:409`
- Impacto:
  - erros podem herdar cor inesperada ou renderizar com fallback inconsistente
  - o design system deixa de ser fonte confiavel para estados semanticos
- Recomendacao:
  - definir os tokens faltantes de erro/alerta/info no tema
  - evitar referencias a variaveis sem declaracao central
- Sugestao de generalizacao/reuso:
  - consolidar um conjunto completo de feedback tokens antes de extrair mais componentes

#### 8. Shared components centrais ja falham no ESLint por `setState` dentro de effect e dependencia faltante

- Severidade: `medio`
- Categoria: `performance`
- Titulo: efeitos em componentes compartilhados estao causando warnings/erros estruturais
- Descricao: `admin-shell`, `entity-autocomplete` e modais de busca fazem `setState` sincrono em `useEffect`, o que ja quebra a validacao atual de React Hooks.
- Evidencia:
  - `src/components/layout/admin-shell.tsx:56-69`
  - `src/features/shared/components/entity-autocomplete.tsx:65-107`
  - `src/features/alunos/components/person-search-modal.tsx:68-100`
  - `src/features/alunos/components/course-search-modal.tsx:78-106`
  - `npx eslint app src --ext .ts,.tsx` retornou 17 problemas, incluindo `react-hooks/set-state-in-effect` e `react-hooks/exhaustive-deps`
- Impacto:
  - piora de renderizacao e hidradacao
  - mais dificuldade para endurecer a esteira de lint
  - propagacao do problema para qualquer tela que consuma esses componentes
- Recomendacao:
  - recalcular estado inicial fora de effects quando possivel
  - migrar para callbacks/eventos assincronos e revisar dependencias reais dos hooks
- Sugestao de generalizacao/reuso:
  - corrigir primeiro os componentes compartilhados; varias telas melhoram em cascata

#### 9. `clientes` continua como modulo demonstrativo, mas segue no mesmo padrao de pastas do produto real

- Severidade: `medio`
- Categoria: `manutenibilidade`
- Titulo: `clientes` duplica patterns antigos e reforca um baseline incorreto
- Descricao: o dominio `clientes` usa dataset hardcoded, filtro local e submit demonstrativo, sem a camada oficial de GraphQL nem os composites compartilhados.
- Evidencia:
  - `README.md:75-81`
  - `src/features/clientes/components/client-search-view.tsx:59-158`
  - `src/features/clientes/components/client-registration-view.tsx:40-43`
  - `src/features/clientes/components/client-registration-view.tsx:62-66`
- Impacto:
  - aumenta custo cognitivo para novos contributors
  - mantem uma implementacao paralela dentro da mesma estrutura de features
  - incentiva copia de um baseline que a propria skill ja marca como demonstrativo
- Recomendacao:
  - isolar melhor o dominio demonstrativo, ou evolui-lo para o padrao oficial, ou retirar sua aparencia de modulo pronto
- Sugestao de generalizacao/reuso:
  - nao extrair nada de `clientes` antes de alinhamento com `pessoas`

#### 10. Lookup de pessoa reutilizavel esta enterrado em `alunos` e vazando para `usuarios`

- Severidade: `medio`
- Categoria: `reuso`
- Titulo: reuso real existe, mas foi centralizado no dominio errado
- Descricao: `usuarios` consome `PersonAutocomplete`, `PersonSearchModal`, `getStudentPersonById` e `MockPerson` a partir de `alunos`, embora o dado de origem seja `pessoas`.
- Evidencia:
  - `src/features/usuarios/components/user-registration-view.tsx:13-16`
  - `src/features/alunos/components/person-autocomplete.tsx:3-5`
  - `src/features/alunos/components/person-search-modal.tsx:8-10`
  - `src/features/alunos/api/search-student-people.ts:1-7`
- Impacto:
  - cria dependencia errada entre dominos
  - torna `alunos` um pseudo modulo shared
  - dificulta evolucao independente de `usuarios` e `pessoas`
- Recomendacao:
  - mover o lookup de pessoa para `src/features/shared` ou `src/features/pessoas`
  - trocar `MockPerson` por um view-model neutro de selecao
- Sugestao de generalizacao/reuso:
  - este e um candidato claro para extracao compartilhada imediata

### Baixo

#### 11. Login ainda contem acoes mortas e credenciais demo expostas

- Severidade: `baixo`
- Categoria: `bug`
- Titulo: formulario de login mistura UX real com artificios de demonstracao
- Descricao: a tela preenche credenciais padrao, exibe o login demo em texto, mostra checkbox "Manter conectado" sem efeito e um link "Recuperar acesso" que aponta para a propria `/login`.
- Evidencia:
  - `src/features/auth/components/login-form.tsx:29-35`
  - `src/features/auth/components/login-form.tsx:145-149`
  - `src/features/auth/components/login-form.tsx:166`
- Impacto:
  - reduz credibilidade do fluxo de auth
  - confunde comportamento esperado em producao
- Recomendacao:
  - remover artificios demo do fluxo principal ou esconda-los explicitamente por ambiente

#### 12. Navegacao ainda aponta muitos modulos reais para a showcase `/components`

- Severidade: `baixo`
- Categoria: `responsividade`
- Titulo: mapa de navegacao mistura arquitetura do produto com placeholder de design system
- Descricao: dezenas de entradas de menu levam para a mesma rota de showcase, incluindo modulos operacionais importantes.
- Evidencia:
  - `src/config/navigation.ts:50-71`
  - `src/config/navigation.ts:79-185`
  - `app/(dashboard)/components/page.tsx:1-13`
- Impacto:
  - IA do produto fica enganosa
  - leitura do escopo real do CRM fica distorcida
- Recomendacao:
  - diferenciar visualmente modulos planejados de modulos implementados
  - evitar usar a mesma rota de components como placeholder de dominio

#### 13. Documentacao interna esta desalinhada com o estado real do front

- Severidade: `baixo`
- Categoria: `padrao`
- Titulo: README e telas bootstrap contradizem as decisoes atuais de auth e data layer
- Descricao: a documentacao ainda afirma que nao ha refresh token e a home do dashboard fala em escolher entre Apollo e urql, apesar do projeto ja ter uma camada oficial definida.
- Evidencia:
  - `README.md:41-47`
  - `src/features/dashboard/components/home-overview.tsx:167-172`
  - `AGENTS.md:26-28`
  - `src/lib/graphql/client.ts:105-155`
- Impacto:
  - novos contribuidores recebem instrucoes conflitantes
  - aumenta risco de introduzir uma segunda camada de estado remoto
- Recomendacao:
  - alinhar README e textos de bootstrap com a arquitetura oficialmente vigente

#### 14. Ha residuos de codigo nao utilizado ou com higiene baixa

- Severidade: `baixo`
- Categoria: `manutenibilidade`
- Titulo: codigo morto e pequenos residuos de qualidade seguem no repositorio
- Descricao: `user-mock-service.ts` nao e consumido por nenhuma feature ativa, `course-autocomplete.tsx` tem varias linhas em branco no final e a vitrine de system design quebra lint por aspas nao escapadas.
- Evidencia:
  - `src/features/usuarios/api/user-mock-service.ts:123`
  - nenhuma referencia encontrada para `getMockUsers`
  - `src/features/alunos/components/course-autocomplete.tsx:58-80`
  - `src/features/system-design/components/system-design-components-showcase.tsx:172`
- Impacto:
  - ruido para manutencao
  - piora do sinal da esteira de qualidade
- Recomendacao:
  - remover codigo morto e limpar residuos pequenos antes que virem baseline

## Tabela de duplicacoes e oportunidades de generalizacao de componentes

| Tema | Evidencias | Oportunidade | Prioridade |
|---|---|---|---|
| Primitive de modal/dialog | `person-registration`, `course-registration`, `company-registration`, `student-registration`, `person-search-modal`, `course-search-modal` | Extrair `Dialog`, `DialogHeader`, `DialogFooter` e regras de acessibilidade | Alta |
| Lookup reutilizavel de pessoas | `user-registration`, `student-registration`, `guardians-editor`, `person-autocomplete`, `person-search-modal` | Mover para `shared` ou `pessoas`, com tipo neutro de selecao | Alta |
| Shell de CRUD com abas laterais + header + feedback | `company-registration`, `course-registration`, `student-registration`, `user-registration` | Criar um composite de formulario tabulado apenas apos estabilizar comportamento | Media |
| Confirmacao de exclusao + sucesso com redirect | `pessoas`, `cursos`, `empresas`, `alunos` | Extrair hooks/composites para reduzir repeticao e inconsistencias | Media |
| Mascaras e normalizacao | `person-registration`, `company-registration` | Centralizar utilitarios de telefone, CPF/CNPJ, CEP e `normalizeOptional` | Media |
| Search scaffold | `pessoas`, `empresas`, `cursos`, `usuarios`, `alunos` | Preservar `TokenizedSearchFilters` e `SearchResultsTable`, mas avaliar um wrapper de pagina de pesquisa | Media |

## Quick wins

- Corrigir o script `lint` oficial e restaurar um comando de validacao confiavel.
- Definir os tokens faltantes de feedback em `app/globals.css`, principalmente erro/destructive.
- Remover do `SearchResultsTable` as opcoes de menu ainda nao implementadas.
- Tirar do login o link circular de recuperacao e o checkbox sem comportamento.
- Marcar visualmente ou esconder itens de navegacao que hoje levam apenas para `/components`.
- Remover `user-mock-service.ts` e outros residuos nao utilizados.

## Melhorias estruturais de medio prazo

- Introduzir protecao server-side para a area autenticada.
- Reorganizar `alunos` em arquivos menores e remover o papel de pseudo-shared de `student-mock-service.ts`.
- Consolidar um primitive de modal/dialog acessivel.
- Extrair o lookup de pessoa para um modulo compartilhado neutro.
- Definir um padrao unico para CRUDs tabulados com tabs laterais, sucesso e exclusao.
- Completar `usuarios` ou reduzir sua UI ao que o backend suporta hoje.

## Riscos, dependencias e pontos que exigem validacao posterior

- A correcao da protecao de rota depende da estrategia oficial de sessao que o projeto quiser adotar para App Router.
- `usuarios` provavelmente precisa de alinhamento com backend para update/delete/grupos.
- `alunos` ja contem compatibilidades para schemas legados; qualquer refactor precisa preservar os contratos hoje em uso.
- O front possui divergencia entre documentos locais; antes de novas features, vale consolidar uma unica fonte de verdade entre `AGENTS.md`, `README.md` e skills.

## Validacoes executadas

- Leitura de `AGENTS.md` e das referencias locais de arquitetura, auth GraphQL e CRUD.
- Inspecao manual de `app/`, `src/`, `package.json`, `README.md`, rotas, features, shared components, auth e GraphQL.
- Execucao de `npm run lint`.
  - Resultado: falhou com `Invalid project directory provided ... front\\lint`.
- Execucao de `npx eslint app src --ext .ts,.tsx`.
  - Resultado: 17 problemas.
  - Principais grupos:
    - `react-hooks/set-state-in-effect` em `admin-shell`, `entity-autocomplete`, `person-search-modal`, `course-search-modal`
    - `react-hooks/exhaustive-deps` em `entity-autocomplete`
    - `react/no-unescaped-entities` em `system-design-components-showcase`
- Verificacao de artefatos estruturais:
  - `middleware.ts`: ausente
  - `tests/`: ausente
  - `stories/`: ausente

# AGENTS.md

## Objetivo
Este repositorio deve priorizar mudancas pequenas, seguras e faceis de revisar.

## Regras de implementacao
- Siga o padrao existente do projeto.
- Prefira diffs minimos.
- Nao altere contratos publicos sem solicitacao explicita.
- Nao altere dependencias, pipelines, infraestrutura ou arquivos de segredo sem solicitacao explicita.
- Nao renomeie arquivos ou mova pastas sem necessidade clara.

## Skills (.codex)
- E permitido usar skills locais contidas em `.codex/skills` para tarefas especializadas.
- Quando houver um `SKILL.md`, siga as instrucoes desse arquivo para fluxo, comandos e artefatos.
- Priorize reutilizar scripts, templates e referencias das skills antes de criar do zero.
- Se uma skill entrar em conflito com regras de seguranca deste `AGENTS.md`, prevalecem as regras deste arquivo.
- Para arquitetura do front, use `.codex/skills/front-architecture/SKILL.md`.
- Para autenticacao GraphQL, use tambem a skill `.codex/skills/auth-graphql/SKILL.md`.
- Para CRUDs, use tambem a skill `.codex/skills/crud-front/SKILL.md`.

## Autenticacao GraphQL (padrao do projeto)
- Endpoint oficial: `https://mundo-da-lua-crm-core.onrender.com/graphql/`.
- Toda comunicacao com backend deve ser via GraphQL.
- Requisicoes autenticadas devem enviar `Authorization: Bearer <token>`.
- `tenantId` deve ser enviado no login e na mutation `refreshToken`.
- Persistir no front: `auth_token`, `auth_expires_at`, `auth_refresh_token`, `auth_refresh_expires_at`, `auth_tenant_id`, `auth_user`.
- Quando `auth_token` expirar, tentar renovar via mutation GraphQL `refreshToken` antes de encerrar sessao.
- Se token expirar ou retornar `AUTH_NOT_AUTHORIZED`, limpar sessao local e redirecionar para `/login`.

## Enums GraphQL (padrao do projeto)
- Valores de enum enviados ao backend devem usar `SCREAMING_SNAKE_CASE`, conforme o schema GraphQL.
- Nao converter enum GraphQL para `PascalCase` ou `camelCase` no payload (ex.: enviar `MOTHER`, nao `Mother`).
- Ao integrar novos enums, preferir tipos/constantes gerados por GraphQL Codegen para evitar drift de convencao.

## Testes e validacoes
- Execute testes relevantes para a area alterada sempre que possivel.
- Se a mudanca impactar comportamento, crie ou ajuste testes.
- Se nao for possivel rodar testes, explique claramente na resposta final.

## Documentacao
- Atualize documentacao apenas quando a mudanca exigir.

## Pull Request
- Resuma o que mudou.
- Liste riscos ou pendencias.
- Cite os testes/validacoes executados.

## Acionamento do backend (obrigatorio)
- Sempre que for necessario consultar informacoes ou solicitar alteracoes no backend, usar o Claude CLI no repositorio `mundo-da-lua-crm-core`.
- Comando padrao:
  `cd "D:\Dev\Mundo da Lua\mundo-da-lua-crm\mundo-da-lua-crm-core" && claude -p "<instrucao>" --dangerously-skip-permissions`
- Em PowerShell, pode usar o equivalente:
  `Set-Location "D:\Dev\Mundo da Lua\mundo-da-lua-crm\mundo-da-lua-crm-core"; claude -p "<instrucao>" --dangerously-skip-permissions`

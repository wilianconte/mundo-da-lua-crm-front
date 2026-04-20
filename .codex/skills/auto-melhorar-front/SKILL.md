---
name: auto-melhorar-front
description: Skill de melhoria contínua para instruções do front. Audita AGENTS.md, CLAUDE.md e skills em .codex/skills, gera propostas objetivas e só aplica mudanças após confirmação explícita do usuário.
---

# Auto Melhorar Front

Use esta skill para revisar e evoluir as instruções operacionais do front-end.

## Quando usar

- quando o usuário pedir para melhorar as instruções do agente
- quando houver sinais de conflito, ambiguidade ou retrabalho recorrente
- quando novas skills forem criadas e ainda não estiverem refletidas nas instruções globais

## Quando nao usar

- para implementar feature de produto
- para alterar código de negócio ou UI sem relação com governança de instruções

## Escopo de auditoria

- `AGENTS.md`
- `CLAUDE.md`
- `.codex/skills/*/SKILL.md`

## Processo

1. Ler os arquivos de escopo e identificar problemas concretos:
- sobreposição ou conflito de regras
- lacunas de fluxo (ex.: validação ausente, skill sem mapeamento)
- inconsistências de linguagem e nomenclatura
- instruções desatualizadas em relação a skills existentes

2. Gerar propostas em formato objetivo:
- Problema
- Evidência (arquivo e trecho)
- Mudança proposta
- Impacto esperado

3. Apresentar propostas uma por vez com opções:
- A: aplicar
- B: ajustar proposta
- C: pular

4. Só após aprovação explícita, aplicar a alteração correspondente.

## Regras de seguranca

- Nunca aplicar mudança sem confirmação explícita do usuário.
- Priorizar alterações pequenas e reversíveis.
- Não remover regra crítica sem substituição clara.
- Manter compatibilidade entre `AGENTS.md` e `CLAUDE.md`.

## Formato de saida

- apresentar uma alteração por vez
- explicar em 2-4 linhas o ganho prático
- oferecer opções A/B/C para decisão

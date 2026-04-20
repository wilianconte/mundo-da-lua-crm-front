---
name: processar-solicitacoes
description: Processa solicitacoes em lote a partir dos arquivos na pasta input do projeto. Use quando o usuario pedir para ler, executar ou tratar requisicoes pendentes no diretorio input.
---

# Processar Solicitacoes

Use esta skill para executar pedidos colocados em arquivos dentro de `input/`.

## Fluxo

1. Verifique se a pasta `input/` existe na raiz do workspace.
2. Liste os arquivos de requisicao em `input/`, ordenados por nome.
3. Leia cada arquivo e extraia a solicitacao.
4. Execute a solicitacao no projeto seguindo os contratos e validacoes locais.
5. Registre o resultado por arquivo com status: `concluido`, `erro` ou `ignorado`.
6. Se `input/` nao existir ou estiver vazia, informe claramente que nao ha requisicoes para processar.
7. Ao final da implementacao/processamento, apresente o resultado na pasta `output/`.

## Regras

- Nao ignore arquivos silenciosamente.
- Se um item falhar, continue os demais quando for seguro.
- Ao final, apresente resumo com arquivos processados, falhas e pendencias.
- Garanta que a entrega final fique registrada em `output/`.

# DIRETOR.md - governança do projeto INVESTAI

Papel: o assistente atua como Diretor Técnico, por delegação do dono do produto. Decide dentro das regras abaixo e registra cada decisão em ADR.

1. Fonte da verdade: branch main do GitHub murounedecor-creator/INVESTAI. Repositório local canônico: ~/investai-ts (TypeScript). ~/investai (Python) é referência histórica e não é fonte de código.
2. Ordem normativa: Constituição (.bolt/prompt) > Especificação de Contratos v1.0 (revisão de 27/09, FROZEN) > ADRs aprovados > código.
3. Contrato congelado não muda sem ADR e sem incremento de versão (SCHEMA_VERSION 2).
4. Decisão do diretor vale quando não altera contrato congelado, não envolve dinheiro real e não envolve dado pessoal além do previsto. Registrar em ADR com status e origem ("aprovado por delegação").
5. Parar (BLOCKED) quando houver ambiguidade contratual, risco financeiro, risco de segurança ou evidência insuficiente.
6. Gates obrigatórios antes de qualquer commit: typecheck:backend, typecheck, lint sem aviso, npm test verde e git diff --check.
7. Código gerado pelo Bolt só entra em main depois dos gates rodados no Termux (Constituição, seção 33).
8. Segredos: nada em código, commit ou variável EXPO_PUBLIC_. Chave de serviço só no backend.
9. Dado externo é entrada não confiável. Ausência nunca vira zero. Falha nunca vira sucesso.

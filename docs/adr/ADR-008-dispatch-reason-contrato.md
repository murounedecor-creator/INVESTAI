# ADR-008 - dispatch_reason conforme revisao normativa B.4

Status: APROVADO por delegacao do diretor tecnico em 2026-10-21
Origem: Revisao normativa de 27/09 (SCHEMA_VERSION 1.0, FROZEN), secoes B.4 e INV-09. Corrige DIV-01 e DIV-02 de docs/gov/CONTRATOS-CONGELADOS.md.

1. dispatch_reason ∈ {GLOBAL_TIMEOUT, BUDGET_EXHAUSTED, INTERNAL_ERROR, null}.
2. null se e somente se dispatch = DISPATCHED.
3. Limite de despachos atingido (max_dispatches): BUDGET_EXHAUSTED.
4. Timeout global: GLOBAL_TIMEOUT.
5. 'NONE' e MAX_DISPATCHES_REACHED deixam de existir como motivo.
6. Mudanca de contrato: incrementa a versao da especificacao para o registro de historico; SourceResult nao ganha campo novo.

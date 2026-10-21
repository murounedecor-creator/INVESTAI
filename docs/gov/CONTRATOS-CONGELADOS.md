# CONTRATOS-CONGELADOS.md - índice e divergências

## Fonte normativa
Revisão normativa de 27/09 (SCHEMA_VERSION 1.0, FROZEN): B.1 raw_hash, B.2 grupos e coverage, B.3 dispatch, B.4 dispatch_reason, B.5 failure_layer e effective, matriz de 7 linhas válidas, INV-17 a INV-22.

## Divergências código x especificação (a confirmar com grep)
FECHADA (ADR-008) DIV-01  dispatch_reason 'NONE' em fonte DISPATCHED. Especificação: null.
FECHADA (ADR-008) DIV-02  MAX_DISPATCHES_REACHED fora do enum B.4. Proposta: BUDGET_EXHAUSTED (ADR a registrar).
FECHADA (ADR-009) DIV-03  createSourceResult não impõe a matriz de 7 linhas nem a INV-18.
DIV-04  CANCELLED pode ocorrer depois da coleta concluída. Especificação: só antes.
DIV-05  isFullCoverage verifica só grupos. Especificação: todas as fontes esperadas.
DIV-06  deriveRunStatus nunca emite DEGRADED; COMPLETE não depende de cobertura.
DIV-07  Linha Python (models/, _resilience.py, base.py) não existe no TypeScript. Decidir por ADR se o TypeScript é a implementação oficial.

## Status
DIV-01, DIV-02 e DIV-03 estão fechadas. DIV-04 a DIV-07 seguem abertas. Correção só com ADR e com testes que falhem antes.

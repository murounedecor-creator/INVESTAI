# ADR-009 - Matriz de SourceResult (spec 27/09, B.1, B.3, INV-17 a INV-20)

Status: APROVADO por delegacao do diretor tecnico em 2026-10-21
Origem: Revisao normativa de 27/09, secao D (matriz de 7 linhas) e INV-17, INV-18, INV-20. Corrige DIV-03 de docs/gov/CONTRATOS-CONGELADOS.md.

1. createSourceResult rejeita toda combinacao fora das 7 linhas validas, com prefixo INVARIANT_VIOLATION.
2. Validas: DISPATCHED com coleta, parse e normalizacao OK/WARN/FATAL; DISPATCHED com parse falho; DISPATCHED com coleta falha (hash nulo ou preenchido, B.1); CANCELLED e NOT_DISPATCHED com coleta, parse falhos e NOT_RUN (NOT_DISPATCHED sem hash, INV-20).
3. collection_ok=false com bytes recebidos aceita raw_hash preenchido (B.1). O teste que exigia null e reclassificado.
4. dispatch_reason nulo somente em DISPATCHED (ADR-008).

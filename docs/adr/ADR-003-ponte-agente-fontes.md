# ADR-003 - Ponte Agent -> SourceOrchestrator (AgentBase)

Status: APROVADO (registro em arquivo em 2026-10-17)

Origem: aprovado em sessao anterior (checkpoint de
2026-10-15) e so agora registrado em arquivo. O texto abaixo
contem apenas o que o checkpoint afirma e o que o codigo de
src/agents/agent-base.ts mostra.

1. AgentBase oferece collectSources(tasks, groups, config).
   Ele chama o SourceOrchestrator e avalia a cobertura
   por grupo.
2. O retorno (SourceCollection) tem sources, coverage e
   requirement_satisfied.
3. sources traz todos os SourceResult, inclusive os de
   falha. Falha de fonte nunca vira sucesso.
4. requirement_satisfied so e true quando todos os grupos
   atingem o minimo. E independente de cobertura completa.
5. Requisito satisfeito vira AgentResult. Nenhum grupo
   satisfeito vira AgentFailure.
6. Caso intermediario (parte dos grupos satisfeita): nao
   definido neste ADR. Decisao pendente.
7. Excecao dentro de execute() vira AgentFailure com
   error_type AGENT_EXCEPTION e mensagem generica. O
   detalhe vai so para o log do servidor.

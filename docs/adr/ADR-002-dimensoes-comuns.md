# ADR-002 - Dimensoes comuns dos agentes

Status: APROVADO (registro em arquivo em 2026-10-17)

Origem: os itens 1 a 3 foram aprovados em sessao anterior
(checkpoint de 2026-10-15) e so agora viram arquivo, por
rastreabilidade (Constituicao 29 e 30). Os itens 4 a 6 foram
aprovados em 2026-10-17. O item 7 repete a regra da secao 5
do prompt do projeto.

1. As dimensoes comuns ficam em analysis.common_dimensions
   do AgentResult.
2. Cada dimensao vale de 0 a 100.
3. Dimensao nao calculavel vale null. Nunca 0.
4. common_dimensions e um mapa por item (ativo):
   common_dimensions[ticker][dimensao] = number | null.
5. O motivo de um null fica ao lado, em
   analysis.common_dimensions_reasons[ticker][dimensao].
   Enquanto nao existir ADR-005 aprovado, o motivo e
   FORMULA_NOT_APPROVED.
6. Dimensoes candidatas (provisorias, a confirmar no
   ADR-005): momentum, source_quality, volatility,
   entry_cost, liquidity.
7. O Comparador le apenas esses campos. Nunca recalcula
   metricas especificas de um agente.

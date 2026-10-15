# ADR-004 - Agente Acoes/ETFs (contrato)
Status: PROPOSTO (decisao do responsavel tecnico)

1. Cinco funcoes puras: financial_analysis, balance_cashflow_analysis,
   valuation_analysis, dividends_analysis, corporate_events_analysis.
2. Entrada: dados ja normalizados. Saida: resultado ou null com motivo.
3. Ausencia nunca vira zero (Constituicao 11 e 19).
4. Cada calculo guarda entradas, formula e data de referencia.
5. Saida em analysis; dimensoes comuns em analysis.common_dimensions (ADR-002).
6. Nesta fase o agente nao busca fonte externa; fontes entram via collectSources.

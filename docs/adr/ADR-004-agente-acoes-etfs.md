# ADR-004 - Agente Acoes/ETFs (contrato) - v2

Status: APROVADO (v2) pelo responsavel tecnico

1. Cinco funcoes puras: financial_analysis,
   balance_cashflow_analysis, valuation_analysis,
   dividends_analysis, corporate_events_analysis.
2. Entrada: dados ja normalizados, tipados em src/agents/.
   Todo objeto de entrada tem reference_date (ISO).
   Campos numericos sao number | null. Nunca 0 por padrao.
3. Saida: ok true com value e trace, ou ok false com
   reason e missing. reason so pode ser MISSING_INPUT,
   INVALID_INPUT ou NOT_APPLICABLE.
4. Ausencia nunca vira zero (Constituicao 11 e 19).
5. trace guarda entradas, formula e reference_date.
6. Saida em analysis. Dimensoes comuns em
   analysis.common_dimensions (ADR-002).
7. Nesta fase todas as dimensoes comuns ficam null com
   motivo FORMULA_NOT_APPROVED. So passam a ser calculadas
   apos um ADR-005 aprovado com formula e janela de cada
   dimensao.
8. AgentResult com dimensoes comuns null continua valido.
   O Comparador trata como confianca reduzida ou deixa o
   agente fora do ranking com uma linha de motivo (ADR da
   secao 5.3).
9. Nesta fase o agente nao busca fonte externa. Fontes
   entram via collectSources (ADR-003).

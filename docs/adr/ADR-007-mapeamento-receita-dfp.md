# ADR-007 - Mapeamento de receita e custo da DFP (CVM)

Status: PROPOSTO por delegacao do responsavel tecnico em 2026-10-20 (aguardando registro de aprovacao)

Origem: cabecalho e exemplos da DRE consolidada 2023 (dfp_cia_aberta_DRE_con_2023.csv).
Achado: o codigo 3.01 e receita de intermediacao financeira no Banco do Brasil e receita de vendas na Petrobras. O codigo sozinho nao identifica a receita.

1. Escopo: somente empresas nao financeiras. Empresa cuja conta 3.01 contenha "Intermediacao Financeira" fica fora (SETOR_FINANCEIRO_NAO_SUPORTADO). Heuristica declarada; classificacao setorial oficial nao verificada.
2. Receita: conta 3.01 cujo DS_CONTA seja "Receita de Venda de Bens e/ou Servicos". Se nao encontrada, MISSING_INPUT. Nunca usar 3.01 cegamente.
3. Custo: conta 3.02. O arquivo traz sinal negativo. O trace guarda o valor lido, e o calculo usa o valor absoluto, declarado no trace.
4. Escala: VL_CONTA em milhares quando ESCALA_MOEDA = MIL. A escala fica no trace.
5. Exercicio: ORDEM_EXERC = ULTIMO (atual) e PENULTIMO (comparacao). DT_INI_EXERC e DT_FIM_EXERC no trace.
6. Reapresentacao: maior VERSAO por (CNPJ_CIA, DT_REFER). Convencao declarada; semantica de VERSAO nao verificada.
7. ITR: fora desta decisao. Layout nao verificado.
8. Pendencias: classificacao setorial oficial; semantica de VERSAO; layout do ITR.

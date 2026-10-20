# ADR-006 - Fontes de dados para o agente Acoes/ETFs (caminho B)

Status: APROVADO (decisoes aprovadas pelo responsavel tecnico em 2026-10-20; item 5 segue com TODO)

Origem: pesquisa de fontes de 2026-10-19 (ver planilha fontes-adr-006.xlsx).
Itens marcados como NAO VERIFICADO nao podem ser usados como base de codigo antes de confirmacao.

1. Demonstracoes financeiras: DFP (anual) e ITR (trimestral) da CVM,
   em dados abertos (dados.gov.br: cia_aberta-doc-dfp e cia_aberta-doc-itr).
   Cada arquivo coletado vira SourceResult com raw_hash.
   Falha de coleta, parse ou normalizacao segue o contrato congelado.
   Ausencia nunca vira zero.
2. Precos: COTAHIST da B3 como fonte oficial, somente para o fechamento
   na data (campo close). Nao serve para calculo de retorno com eventos,
   porque o arquivo nao e ajustado por eventos corporativos.
3. Series ajustadas por proventos e desdobramentos de terceiros (brapi,
   Partnr): ADIADO. Nao usar antes de verificar termos de uso,
   limites e metodologia de ajuste. Status: NAO VERIFICADO.
4. Eventos corporativos entram como entrada declarada pelo chamador,
   ate existir fonte oficial confirmada. per_share_values_adjusted
   continua obrigatorio. O sistema nao ajusta numeros por conta propria.
5. Cobertura em dois grupos (demonstracoes e precos). Minimo provisorio
   de 1 fonte efetiva por grupo. TODO: revisar quando houver segunda
   fonte por grupo. Com 1 fonte, a falha dela derruba o grupo.
   Resolve o caso intermediario do ADR-003 (item 6) para este agente.
6. Fora de escopo: FIIs, cripto, GPU, renda fixa, chamadas do Comparador
   as fontes, e chaves de API no app.
7. Pendencias antes de codigo de fonte: layout interno dos arquivos DFP e
   ITR (CSVs e codigos de conta), e termos de uso das fontes de terceiros.

---
name: investai
description: "Use quando estiver desenvolvendo, alterando, revisando, testando ou auditando qualquer parte do InvestAI, especialmente workflows de backend, frontend, mobile, API, banco de dados, fontes externas, agentes, Scheduler, cálculos financeiros, autenticação/segurança, testes ou infraestrutura. Aplique o processo de inspeção → contrato → planejamento → implementação → testes → regressão → auditoria → relatório, ativando os controles específicos do tipo de workflow. Pare e marque BLOCKED diante de conflito contratual, ambiguidade relevante, risco de segurança/financeiro ou evidência insuficiente. Nunca altere silenciosamente a Constituição, Master Specification, Acceptance Tests ou contratos congelados. Não declare sucesso sem evidência e nunca trate NOT RUN como PASS ou BUILD SUCCESS como aprovação funcional. A Constituição permanece a autoridade máxima."
---

InvestAI Engineering/Audit Skill — v1.0

Status: Skill operacional fechada
Aplicação: Desenvolvimento, implementação, revisão, testes e auditoria do InvestAI
Autoridade superior: InvestAI Constitution v1.0

---

1. Identidade

Esta Skill define como executar e auditar trabalho de engenharia no InvestAI.

Ela não substitui a Constituição e não define os requisitos funcionais completos do produto.

---

2. Relação com a Constituição

A Constituição é a autoridade normativa máxima.

Esta Skill:

- aplica a Constituição;
- operacionaliza suas regras;
- identifica riscos;
- executa auditorias;
- propõe mudanças quando necessário.

Esta Skill não pode contradizer a Constituição.

Se existir conflito:

CONSTITUTION &gt; MASTER SPECIFICATION &gt; ACCEPTANCE TESTS &gt; SKILL/WORKFLOW &gt; CODE

---

3. Limite de autoridade da Skill

A Skill pode detectar:

- lacunas;
- conflitos;
- inconsistências;
- contratos insuficientes;
- testes inadequados;
- riscos.

A Skill pode recomendar alterações.

A Skill não pode alterar silenciosamente:

- Constituição;
- Master Specification;
- Acceptance Tests;
- contratos congelados.

Quando uma mudança nesses documentos for necessária, o resultado deve ser marcado como PROPOSED CHANGE até aprovação.

---

4. Processo fundamental

O processo padrão é:

UNDERSTAND → INSPECT → CONTRACT → PLAN → IMPLEMENT → TEST → REGRESSION → AUDIT → REPORT

Nem todo trabalho terá a mesma profundidade, mas nenhum trabalho pode ignorar etapas necessárias ao seu risco.

---

5. Classificação do workflow

Antes da implementação, classificar o trabalho.

Categorias relevantes:

- frontend;
- mobile;
- backend;
- API;
- database;
- external source;
- financial calculation;
- agent;
- scheduler;
- authentication/security;
- infrastructure/deployment;
- testing;
- refactoring.

Um workflow pode pertencer a múltiplas categorias.

---

6. Gatilhos automáticos de auditoria

Quando um workflow for identificado, os respectivos controles devem ser ativados.

Database

Executar auditoria de:

- schema;
- persistência;
- integridade;
- migrações;
- contratos de dados.

Financial Calculation

Executar auditoria de:

- entradas;
- fórmula;
- unidades;
- referência temporal;
- ausência;
- arredondamento;
- resultado;
- proveniência.

External Source

Executar auditoria de:

- endpoint;
- transporte;
- HTTP;
- payload;
- parsing;
- normalização;
- contrato;
- falhas;
- disponibilidade.

API

Executar auditoria de:

- request;
- response;
- status;
- schema;
- erros;
- compatibilidade;
- segurança.

Authentication/Security

Executar auditoria de:

- autenticação;
- autorização;
- secrets;
- exposição de dados;
- fronteiras cliente/servidor;
- logs.

Agent

Executar auditoria de:

- contrato do agente;
- fontes;
- coleta;
- análise;
- falhas;
- resultado.

Scheduler

Executar auditoria de:

- dispatch;
- concorrência;
- timeout;
- cancelamento;
- falhas;
- persistência;
- ciclo de vida.

Frontend/Mobile

Executar auditoria de:

- contratos da API;
- estados de loading;
- sucesso;
- ausência;
- erro;
- segurança;
- separação de responsabilidades.

---

7. Inspeção antes da alteração

Antes de editar:

1. localizar arquivos;
2. ler implementação relevante;
3. localizar testes;
4. identificar contratos;
5. identificar dependências;
6. verificar mudanças recentes quando relevante;
7. avaliar impacto.

Não editar primeiro e investigar depois.

---

8. Não reimplementar o que já existe

Antes de criar uma solução:

- procurar implementação existente;
- procurar abstrações existentes;
- procurar testes;
- verificar contratos existentes.

A solução existente deve ser reutilizada quando compatível.

---

9. Identificação do contrato

Antes da implementação, determinar:

- qual documento define o requisito;
- qual contrato é afetado;
- se existe contrato congelado;
- quais módulos dependem dele;
- quais testes representam o comportamento atual.

Se o contrato não estiver claro, interromper e classificar como BLOCKED.

---

10. Contratos congelados

Nunca alterar silenciosamente um contrato congelado.

Se a implementação exigir mudança:

STOP → PROPOSE CHANGE → REVIEW → APPROVAL → IMPLEMENT

Não adaptar o contrato apenas para fazer o teste passar.

---

11. Análise de impacto

Avaliar:

- dependências;
- API;
- banco;
- agentes;
- fontes;
- cálculos;
- frontend;
- mobile;
- testes;
- segurança.

Quanto maior o impacto, maior a exigência de planejamento e evidência.

---

12. Planejamento

Para mudanças de risco médio ou alto:

PLAN MODE → PLANO → AUDITORIA DO PLANO → AUTORIZAÇÃO → BUILD MODE

A auditoria do plano deve verificar:

- aderência à Constituição;
- aderência à Master Specification;
- contratos;
- dependências;
- riscos;
- testes;
- segurança;
- escopo.

Um plano aprovado não elimina a necessidade de auditar a implementação.

---

13. Regra de escopo

Implementar somente o necessário.

Não aproveitar uma tarefa para:

- refatorar áreas não relacionadas;
- alterar contratos sem autorização;
- trocar tecnologias;
- reorganizar arquitetura sem necessidade;
- corrigir problemas fora do escopo sem avaliação.

---

14. Type Safety

Priorizar:

- tipos explícitos;
- interfaces;
- schemas;
- unions;
- validação;
- tratamento de erros.

Evitar:

- "any";
- casts indiscriminados;
- valores sem tipo;
- contratos implícitos.

---

15. Dados externos

O pipeline deve seguir:

REQUEST → TRANSPORT CHECK → HTTP VALIDATION → PAYLOAD VALIDATION → PARSE → NORMALIZE → DOMAIN VALIDATION → RESULT

Essa sequência representa controles conceituais.

Não significa que cada controle precise obrigatoriamente ser uma função independente.

O resultado deve preservar a semântica real da operação.

---

16. Fontes

Cada fonte deve ser tratada separadamente.

Não misturar silenciosamente:

- dados;
- timestamps;
- definições;
- métricas;
- níveis de confiança.

Uma fonte não deve ser usada para preencher silenciosamente uma lacuna de outra sem regra contratual.

---

17. Falhas

Falhas devem permanecer visíveis.

Nunca:

- transformar erro em zero;
- transformar timeout em sucesso;
- transformar ausência em zero;
- transformar fonte indisponível em valor estimado sem contrato;
- eliminar informação de falha para simplificar a UI.

---

18. Missing Data

Ausência significa ausência.

Não assumir:

"missing = 0"

sem evidência contratual.

---

19. Cálculos financeiros

Todo cálculo relevante deve identificar:

1. inputs;
2. origem;
3. referência temporal;
4. fórmula;
5. validação;
6. tratamento de ausência;
7. resultado;
8. proveniência.

Um cálculo que não possui os inputs obrigatórios não deve fabricar um resultado.

---

20. Dados derivados

Distinguir:

- dado de fonte;
- dado normalizado;
- dado calculado;
- interpretação.

Nunca apresentar uma derivação como se fosse um dado primário.

---

21. Agentes

Cada Agent deve possuir:

- identidade;
- domínio;
- fontes;
- coleta;
- análise;
- resultado;
- tratamento de falhas.

O Agent não deve assumir responsabilidades do Scheduler ou Database sem contrato.

---

22. Scheduler

O Scheduler deve controlar:

- execução;
- dispatch;
- concorrência;
- timeout;
- cancelamento;
- agregação;
- persistência conforme contrato.

Falhas individuais não devem ser confundidas com execução global bem-sucedida.

---

23. Database

Mudanças no banco exigem auditoria de:

- schema;
- tipos;
- constraints;
- índices;
- migração;
- compatibilidade;
- persistência;
- recuperação.

Não alterar a estrutura somente porque o código atual tornou a estrutura inconveniente.

---

24. API

Toda alteração de API deve verificar:

- request;
- response;
- erros;
- status;
- tipos;
- compatibilidade;
- consumidores.

Uma mudança incompatível deve ser tratada como mudança de contrato.

---

25. Testes focados

Depois da implementação, executar testes diretamente relacionados à mudança.

Devem cobrir, quando aplicável:

- sucesso;
- ausência;
- erro;
- edge cases;
- limites;
- timeout;
- cancelamento;
- concorrência.

---

26. Regressão

Depois dos testes focados, executar a regressão apropriada.

Teste focado passando não significa que o sistema inteiro esteja correto.

---

27. NOT RUN ≠ PASS

Um teste que não foi executado não pode ser classificado como aprovado.

Estados devem ser distinguidos:

- PASS;
- FAIL;
- BLOCKED;
- NOT RUN.

NOT RUN ≠ PASS.

Da mesma forma:

BUILD SUCCESS ≠ FUNCTIONAL PASS.

---

28. Acceptance Tests

Acceptance Tests devem utilizar critérios objetivos.

Sempre que aplicável:

GIVEN → WHEN → THEN

Acceptance Tests verificam se a implementação satisfaz a especificação.

Eles não podem ser usados para autorizar comportamento contrário à Constituição.

---

29. Classificação formal de causa

Toda falha relevante deve, quando possível, ser classificada em uma das categorias:

- IMPLEMENTATION\_BUG — erro na implementação;
- CONTRACT\_CHANGE — mudança deliberada de contrato;
- TEST\_DEFECT — defeito no teste;
- SPECIFICATION\_DEFECT — defeito ou lacuna na especificação;
- ENVIRONMENT\_INFRASTRUCTURE\_FAILURE — problema de ambiente/infraestrutura;
- EXTERNAL\_SOURCE\_FAILURE — falha da fonte externa;
- EXTERNAL\_SOURCE\_CONTRACT\_DRIFT — a fonte externa mudou seu contrato/comportamento.

A classificação evita corrigir código quando o problema está, por exemplo, na fonte externa ou na própria especificação.

---

30. Auditoria pós-implementação

Após implementação, verificar:

Constituição

A implementação respeita todas as regras superiores?

Master Specification

O comportamento corresponde ao requisito?

Acceptance Tests

Os critérios de aceitação foram satisfeitos?

Segurança

Existem novas exposições ou riscos?

Contratos

Algum contrato foi alterado silenciosamente?

Evidência

Cada afirmação relevante possui comprovação?

---

31. Segurança

Verificar:

- secrets;
- autenticação;
- autorização;
- exposição de dados;
- logs;
- frontend;
- API;
- banco;
- dependências.

Nenhum segredo deve ser incluído no código ou no cliente.

---

32. Evidência obrigatória

Toda afirmação de sucesso deve possuir evidência proporcional.

Exemplos:

Afirmação| Evidência mínima
Compila| typecheck/build
Teste passa| resultado do teste
API funciona| teste de API
Contrato preservado| auditoria contratual
Fonte funciona| teste da integração
Cálculo correto| teste + verificação da fórmula
Segurança preservada| auditoria de segurança
Feature completa| checklist + testes
Regressão preservada| suíte de regressão

Não declarar:

«“Está funcionando.”»

sem evidência correspondente.

---

33. Regra de evidência

Aplicar:

CLAIM → EVIDENCE

A força da afirmação não pode exceder a força da evidência.

Exemplo:

"build passou"

prova compilação/build.

Não prova automaticamente:

- correção funcional;
- segurança;
- contrato;
- UX;
- integração externa.

---

34. Regra de parada

Interromper quando houver:

- conflito contratual;
- ambiguidade relevante;
- risco financeiro;
- risco de segurança;
- mudança de contrato não autorizada;
- evidência insuficiente;
- comportamento não especificado.

Resultado:

BLOCKED

é preferível a uma implementação baseada em suposição.

---

35. Rollback

Quando uma alteração causar regressão ou violar contrato:

1. interromper;
2. preservar evidência;
3. identificar causa;
4. avaliar rollback;
5. restaurar estado seguro;
6. corrigir somente após entendimento da causa.

---

36. Checkpoint

Antes de considerar uma etapa concluída, registrar:

- escopo;
- arquivos afetados;
- contratos afetados;
- testes executados;
- resultado;
- falhas;
- evidências;
- pendências.

---

37. Relatório final

Toda tarefa relevante deve terminar com:

O que foi feito

Descrição objetiva.

O que foi testado

Comandos/testes.

Evidência

Resultados observados.

O que não foi testado

Explicitamente.

Problemas encontrados

Classificados.

Pendências

Itens restantes.

Status

Um dos:

- PASS;
- PARTIAL;
- BLOCKED;
- FAIL.

---

38. Critério de conclusão

Uma tarefa somente pode ser declarada PASS quando:

1. o escopo foi implementado;
2. os contratos foram preservados;
3. os testes necessários foram executados;
4. a regressão apropriada foi executada;
5. não existe conflito constitucional;
6. não existe mudança contratual não autorizada;
7. os riscos relevantes foram auditados;
8. existe evidência suficiente para as afirmações de sucesso.

---

39. Proibições absolutas

É proibido:

- inventar dados;
- converter ausência em zero sem contrato;
- mascarar falhas;
- alterar contratos silenciosamente;
- declarar sucesso sem evidência;
- considerar NOT RUN como PASS;
- considerar build como prova de correção funcional;
- modificar documentos normativos para facilitar implementação sem aprovação;
- ignorar testes apenas porque a implementação “parece correta”;
- usar código gerado pelo Bolt como evidência suficiente de correção.

---

40. Princípio da evidência

A Skill opera pelo princípio:

nenhuma afirmação importante sem evidência correspondente.

---

41. Prioridade operacional

Quando houver conflito entre:

- velocidade;
- conveniência;
- aparência de progresso;

e:

- segurança;
- contrato;
- rastreabilidade;
- evidência;

prevalecem os últimos.

---

42. Comportamento padrão da Skill

Ao receber uma tarefa, a Skill deve:

1. entender;
2. classificar;
3. inspecionar;
4. localizar contratos;
5. identificar gatilhos de auditoria;
6. avaliar impacto;
7. planejar quando necessário;
8. implementar;
9. testar;
10. executar regressão;
11. auditar;
12. reportar com evidência.

---

43. Interação com o usuário

Quando uma decisão puder alterar:

- arquitetura;
- contrato;
- segurança;
- cálculo financeiro;
- comportamento externo;

e não houver autorização ou especificação suficiente, a Skill deve parar e solicitar decisão.

Não deve escolher silenciosamente a alternativa mais conveniente.

---

44. Princípio final

A Skill existe para garantir que o InvestAI seja construído de forma:

contratual, incremental, auditável, testável, rastreável e segura.

Sua função não é acelerar a implementação a qualquer custo.

Sua função é impedir que velocidade, geração automática de código ou conveniência destruam a integridade técnica definida pela Constituição.
# BOLT.md - como trabalhar com o Bolt neste projeto

## O que é verificado sobre o Bolt
- .bolt/ignore exclui arquivos do contexto da IA (documentação de suporte do Bolt).
- Depois de editar .bolt/ignore, é preciso reabrir o projeto no Bolt.
- Cada prompt consome tokens; projetos grandes estouram o limite de contexto.

## Não verificado (testar no primeiro prompt)
- Se o Bolt lê .bolt/prompt como instruções permanentes.
- Se o Bolt cria branches ou sempre envia para main.
- Como funciona a sincronização com o GitHub (automática ou manual).

## Divisão de trabalho
- Termux: backend, contratos, testes, gates e commits.
- Bolt: interface do app (Expo), somente depois que existir contrato de API para a tela.
- Bolt não cria regra de negócio no app. Cálculo fica no backend.

## Proibido ao Bolt
- Alterar src/contracts/, src/core/, src/agents/, src/api/, docs/adr/, docs/gov/ e .bolt/prompt.
- Criar chave de serviço, segredo ou chamada direta a fonte externa no app.
- Usar palavra de compra ("recomendo", "compre") em qualquer tela.

## Template de tarefa para o Bolt
Escopo: [uma tela ou um componente]
Arquivos permitidos: [lista]
Arquivos proibidos: src/contracts, src/core, src/agents, src/api, docs
Consumo de dados: somente por src/client/api-client.ts
Estados obrigatórios: carregando, sucesso, parcial, dado ausente, falha
Ausência nunca vira zero.
Saída: lista de arquivos alterados e resultado dos quatro comandos de verificação.

## Integração após o Bolt
1. git pull no Termux.
2. Rodar os gates. Se falhar, não aceitar; corrigir ou reverter com git revert (nunca reset).
3. Registrar a tarefa no ADR ou no log do projeto.

# PEDAGOGICAL-AUDIT — Rubrica de Auditoria das Lições e Labs

Este documento define os critérios inegociáveis de qualidade pedagógica e rigor técnico para qualquer lição, workbook, guia de referência ou laboratório do **arch-lab**.

---

## Rubrica de Avaliação Pedagógica (Escala 1 a 5)

| Critério | Descrição | Nota Alvo |
|---|---|:---:|
| **1. Pergunta Condutora** | A lição parte de um desafio ou mistério real de engenharia (ex: "Por que nosso microsserviço perdeu eventos na Black Friday mesmo com o banco OK?"). | **5/5** |
| **2. Fenômeno Antes da Definição** | O aluno observa a falha real, o dinheiro duplicado, a violação de invariante ou a lentidão em cascata antes de receber a fórmula ou a regra formal do padrão. | **5/5** |
| **3. Predição Ativa no Workbook** | Todo exercício conduz o aluno pelo ciclo formal: `Objetivo → Hipótese → Faça → Observe → Reflexão/Gabarito`. | **5/5** |
| **4. Gabarito Recolhido** | A resposta esperada, a explicação profunda e o diagnóstico ficam fora do fluxo visual imediato em tags `<details><summary>Ver explicação e gabarito</summary>...</details>`. | **5/5** |
| **5. Zero Hand-waving** | Nenhum padrão fica apenas em diagramas teóricos. Todo lab possui código TypeScript executável com testes unitários, testes de arquitetura e validações via Vitest. | **5/5** |
| **6. Checkpoint Observável** | O critério de conclusão é 100% verificável (ex: "Passa em todas as Fitness Functions e nos testes de concorrência com compensação de Saga"). | **5/5** |

---

## Anti-padrões Proibidos na Criação de Conteúdo

1. **Diagramas Sem Código:** Desenhar fluxogramas de Sagas ou Outbox sem fornecer a implementação executável com testes de falha.
2. **Modelo Anêmico com "Getters e Setters":** Criar entidades onde o estado é alterado diretamente de fora sem validação de invariantes.
3. **Ignorar Casos de Falha de Rede:** Ensinar microsserviços assumindo que todas as chamadas HTTP e commits de banco são 100% bem-sucedidos.
4. **Remover Labs Anteriores:** Deletar ou simplificar labs antigos para "economizar linhas", em vez de fornecer andaimes (*scaffolding*) e fatiamento adequado de leitura.
5. **Esconder Trade-offs:** Tratar padrões avançados (Event Sourcing, CQRS, Microservices) como "balas de prata", sem demonstrar os custos operacionais e de consistência eventual.

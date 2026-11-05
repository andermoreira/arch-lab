# Implementation Plan: arch-lab-audit

## Overview

Este plano converte o desenho da auditoria em tarefas incrementais de código, organizadas pelo sequenciamento de governança das quatro frentes — **Frente A** (saúde de código e testes) → **Frente B** (fidelidade arquitetural por fase 00–08) → **Frente C** (revisão didática) → **Frente D** (consistência estrutural e links). Cada tarefa segue o Ciclo **DCE — Diagnosticar → Corrigir → Evidenciar** (Requirement 9.2) e respeita o princípio **complementar ≠ remover**: nenhuma lição, workbook ou laboratório é apagado, somente melhorado ou substituído (Requirements 9.3, 9.5).

A Frente A estabelece primeiro o andaime do Nível Opt-in e a base verde determinística; só então a Frente B julga fidelidade arquitetural; a Frente C revisa a didática sobre o código já estabilizado; a Frente D fecha com links e artefatos de build sincronizados. Os testes de propriedade referenciam as 12 propriedades de correção do `design.md` no formato **Feature: arch-lab-audit, Property {n}** e rodam no mínimo 100 iterações. Prosa em pt-BR; identificadores, arquivos, testes e código em inglês (Requirement 9.7).

## Tasks

- [ ] 1. Frente A — Estabelecer o andaime do Nível Opt-in de integração
  - [ ] 1.1 Configurar projetos Vitest `unit` e `integration`
    - Diagnosticar: confirmar que `vitest.config.ts` atual coleta `lab/**/*.test.ts`/`*.spec.ts` sem separar integração
    - Corrigir: reescrever `vitest.config.ts` com `projects` `unit` (`include` `*.test.ts`/`*.spec.ts`, `exclude` `**/*.integration.test.ts`) e `integration` (`include` `**/*.integration.test.ts`), preservando `testTimeout: 10000`
    - Evidenciar: `npm test` roda só `unit` e conclui verde
    - _Requirements: 1.4, 8.3_

  - [ ] 1.2 Adicionar script `test:integration` e alvo Makefile correspondente
    - Corrigir: adicionar `test:integration` em `package.json` (roda só o projeto `integration`) e alvo `test-integration` no `Makefile` coerente com `docker compose` (Postgres 16 + Redis 7)
    - Garantir que `test`, `test:arch` e `test:unit` continuem particionando as suítes corretamente após os projetos Vitest
    - Evidenciar: `test:integration` só executa com `ARCH_LAB_INTEGRATION=1`; demais scripts permanecem verdes
    - _Requirements: 8.2, 8.3_

  - [ ] 1.3 Criar seam de guarda de ambiente para suítes de integração
    - Corrigir: introduzir o padrão `describe.skipIf(!process.env.ARCH_LAB_INTEGRATION)` como convenção, aplicado ao abrir qualquer `*.integration.test.ts`
    - Registrar justificativa de trade-off da camada redundante "cinto e suspensório" (Decisão D1)
    - _Requirements: 1.4, 8.3, 9.4_

- [ ] 2. Frente A — Base verde determinística e tipagem segura (transversal a todas as fases)
  - [ ] 2.1 Auditar e garantir suítes sempre-verdes 100% in-memory nas fases 00–08
    - Diagnosticar: rodar `npm test` e `npm run test:arch`; inventariar qualquer teste que abra conexão com `pg`/`ioredis` ou dependa de infra real
    - Corrigir: refatorar cada caso para Fake Determinístico in-memory (`InMemory*Repository`, event store em array, broker em fila de memória, cache `Map` com TTL simulado) respeitando o contrato de porta, ou mover para `*.integration.test.ts`
    - Evidenciar: `npm test` e `npm run test:arch` verdes sem Docker
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 2.2 Eliminar testes falso-positivos
    - Diagnosticar: localizar testes que passam sem asserir o comportamento que afirmam validar (ex.: `expect(true).toBe(true)` fora de guarda de integração, asserções ausentes)
    - Corrigir: asserir o comportamento real ou substituir por teste equivalente que o faça; nunca remover sem substituição
    - _Requirements: 2.1_

  - [ ] 2.3 Remover `any` injustificado e casts perigosos sob modo estrito
    - Diagnosticar: varrer código e testes das fases por `any`/casts inseguros
    - Corrigir: substituir por tipagem explícita e segura; se exigir mudança de contrato de porta, ajustar a porta preservando isolamento de domínio
    - Evidenciar: `npm run lint` (`tsc --noEmit`) conclui sem erros de tipo
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 2.4 Escrever teste de propriedade para suítes independentes de infraestrutura
    - **Property 11: Suítes sempre-verdes são independentes de infraestrutura**
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - Verificar que nenhum teste da camada sempre-verde abre conexão com Postgres/Redis e que toda porta secundária é satisfeita por Fake Determinístico

- [ ] 3. Frente A — Determinismo de testes assíncronos e de concorrência
  - [ ] 3.1 Generalizar costuras determinísticas (fake timers, sleep/random injetáveis, tick/drain)
    - Diagnosticar: identificar testes intermitentes em Outbox (05), Sagas (06), condições de corrida e Circuit Breaker (07)
    - Corrigir: aplicar `vi.useFakeTimers()` + `advanceTimersByTime`, `sleep`/`random` injetáveis, sincronização explícita por promessas resolvidas manualmente, e relay/broker dirigidos por `tick()`/`drain()` em vez de `setInterval` real — generalizando o padrão já presente em `resilience.test.ts`
    - Registrar justificativa de trade-off da exposição de seams de teste (Decisão D3)
    - _Requirements: 3.1, 3.3, 9.4_

  - [ ] 3.2 Verificar estabilidade com "run N times" (N ≥ 10)
    - Evidenciar: executar cada alvo previamente intermitente 10 vezes consecutivas, interrompendo no primeiro fracasso, obtendo 10 aprovações idênticas
    - _Requirements: 3.2_

  - [ ]* 3.3 Escrever teste de propriedade para determinismo sob repetição
    - **Property 12: Determinismo de testes assíncronos sob repetição**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 4. Checkpoint — Frente A concluída
  - Garantir que todos os testes passam; perguntar ao usuário em caso de dúvidas.

- [ ] 5. Frente B — Fase 00 Fitness Functions mordem violações injetadas
  - [ ] 5.1 Provar que a Fitness Function reprova violação de camada (prova negativa)
    - Diagnosticar: injetar violação em `sample-codebase/tainted-domain` (ex.: import de `pg` no domínio) e confirmar que a avaliação acusa arquivo/linha/import
    - Corrigir: ajustar regra/engine até a violação injetada ser reprovada; garantir que a prova negativa (código limpo) retorna zero violações; manter cobertura de import multi-linha, `import type`, re-export e `import`/`require` dinâmico
    - Evidenciar: `npm run test:arch` verde com o teste de prova negativa e positiva
    - _Requirements: 4.1_

  - [ ]* 5.2 Escrever teste de propriedade para reprovação de violações de camada
    - **Property 1: Fitness Function reprova violações de camada**
    - **Validates: Requirements 4.1, 6.4**

- [ ] 6. Frente B — Fase 01 Métricas de Martin pelas fórmulas canônicas
  - [ ] 6.1 Corrigir e verificar cálculo de I, A e D
    - Corrigir: assegurar `I = Ce/(Ca+Ce)` (com `I = 0` quando `Ca+Ce = 0`), `A = abstractTypes/totalTypes` (com `A = 0` quando `totalTypes = 0`) e `D = |A + I − 1|`
    - Adicionar/ajustar testes-exemplo com valores conhecidos (estável+abstrato → `D ≈ 0`; instável+concreto → `D ≈ 0`; zona de dor/inutilidade → `D → 1`)
    - _Requirements: 4.2_

  - [ ]* 6.2 Escrever teste de propriedade para limites das métricas
    - **Property 2: Limites das métricas de Martin**
    - **Validates: Requirements 4.2**
    - Para qualquer grafo de imports: `0 ≤ I ≤ 1`, `0 ≤ A ≤ 1`, `0 ≤ D ≤ 1`

- [ ] 7. Frente B — Fase 02 Hexagonal com isolamento de domínio
  - [ ] 7.1 Garantir pureza de domínio e separação driving/driven
    - Diagnosticar: verificar imports em `domain/` e `ports/`
    - Corrigir: remover acoplamento a `pg`/`ioredis`/`express` ou a `adapters/` no núcleo; manter separação estrita de portas primárias e secundárias; garantir que `CreateOrderService` opera indistintamente sobre Fakes in-memory e adaptadores reais
    - Adicionar/ajustar Fitness Function de pureza de domínio que reprova imports proibidos no núcleo
    - _Requirements: 4.3, 4.4_

- [ ] 8. Frente B — Fase 03 DDD tático (invariantes e Value Objects)
  - [ ] 8.1 Garantir proteção de invariantes do Aggregate Root e VOs imutáveis
    - Corrigir: assegurar que transições inválidas lançam erro de domínio; VOs rejeitam construção inválida, não expõem setters, usam `readonly`/`Object.freeze` e igualdade estrutural; eliminar modelo anêmico
    - _Requirements: 5.1_

  - [ ]* 8.2 Escrever teste de propriedade para invariantes do Aggregate Root
    - **Property 3: Invariantes do Aggregate Root são preservadas**
    - **Validates: Requirements 5.1**

  - [ ]* 8.3 Escrever teste de propriedade para imutabilidade e igualdade de VOs
    - **Property 4: Imutabilidade e igualdade estrutural de Value Objects**
    - **Validates: Requirements 5.1**

- [ ] 9. Frente B — Fase 04 CQRS & Event Sourcing
  - [ ] 9.1 Garantir split leitura/escrita, event store append-only e replay determinístico
    - Corrigir: assegurar que o event store só faz append com versão monotônica (nunca sobrescreve/remove); projeção de leitura derivável exclusivamente do log; separação comando/projeção
    - Adicionar/ajustar testes-exemplo de reconstrução de estado
    - _Requirements: 5.2_

  - [ ]* 9.2 Escrever teste de propriedade para replay determinístico
    - **Property 5: Replay determinístico do event store**
    - **Validates: Requirements 5.2**
    - `replay(log) == replay(log)` e `state_after_commands == replay(event_log)`

- [ ] 10. Frente B — Fase 05 EDA & Transactional Outbox
  - [ ] 10.1 Demonstrar o fenômeno do dual-write antes da solução
    - Corrigir: garantir cenário executável que exibe a inconsistência do dual-write (commit no banco e publicação no broker divergindo sob falha) **antes** do Outbox — preservando fenômeno-antes-da-definição
    - _Requirements: 5.3, 9.5_

  - [ ] 10.2 Garantir relay do Outbox e consumidor idempotentes
    - Corrigir: Outbox escreve estado + mensagem na mesma transação (Fake in-memory na suíte verde); relay dirigido por `tick()`; consumidor idempotente para entregas repetidas
    - _Requirements: 5.4_

  - [ ]* 10.3 Escrever teste de propriedade para idempotência do consumidor
    - **Property 6: Idempotência do consumidor de Outbox**
    - **Validates: Requirements 5.4**
    - Para qualquer evento e `n ≥ 1`, aplicar `n` vezes tem o mesmo efeito de aplicar uma vez

  - [ ]* 10.4 Adicionar teste de integração opt-in da transação do Outbox
    - Criar `*.integration.test.ts` com guarda `skipIf` que valida transação única contra Postgres real quando `ARCH_LAB_INTEGRATION=1` (Decisão D2)
    - _Requirements: 8.3_

- [ ] 11. Checkpoint — Fases 00–05 da Frente B concluídas
  - Garantir que todos os testes passam; perguntar ao usuário em caso de dúvidas.

- [ ] 12. Frente B — Fase 06 Sagas distribuídas
  - [ ] 12.1 Garantir compensações idempotentes que cobrem falhas intermediárias
    - Corrigir: falha em cada passo intermediário dispara exatamente as compensações dos passos `0..k-1` em ordem inversa; reexecutar compensação não gera efeito adicional; rollback completo retorna a estado consistente
    - _Requirements: 6.1_

  - [ ]* 12.2 Escrever teste de propriedade para cobertura e idempotência das compensações
    - **Property 7: Cobertura e idempotência das compensações da Saga**
    - **Validates: Requirements 6.1**

- [ ] 13. Frente B — Fase 07 Padrões de resiliência
  - [ ] 13.1 Garantir semântica de produção de Circuit Breaker, Bulkhead, Retry+Jitter e Throttling
    - Corrigir: Circuit Breaker CLOSED→OPEN no limiar, fail-fast em OPEN, HALF_OPEN após cooldown, re-OPEN se a chamada de teste falha; Bulkhead rejeita acima do limite e libera slots; Retry com backoff exponencial + full jitter e classificação de erro não-retryável; Throttling conforme configurado — mantendo determinismo via fake timers/seams
    - _Requirements: 6.2_

  - [ ]* 13.2 Escrever teste de propriedade para semântica do Circuit Breaker
    - **Property 8: Semântica do Circuit Breaker**
    - **Validates: Requirements 6.2**

  - [ ]* 13.3 Escrever teste de propriedade para backoff exponencial com full jitter
    - **Property 9: Backoff exponencial com full jitter**
    - **Validates: Requirements 6.2**

- [ ] 14. Frente B — Fase 08 Capstone Enterprise Checkout
  - [ ] 14.1 Garantir coesão do checkout distribuído e bloqueio de vazamento de infraestrutura
    - Corrigir: bounded contexts (Orders, Payments, Inventory) com núcleos isolados; Saga orquestrada com compensação automática sob falha; Outbox sem dual-write; Fitness Functions (`capstone-fitness.test.ts`) reprovando import de `pg`/`ioredis`/`express` ou de `adapters/` no domínio/portas, com prova negativa de agregado fictício que importa driver
    - _Requirements: 6.3, 6.4_

  - [ ]* 14.2 Escrever teste de propriedade para isolamento de infraestrutura no capstone
    - **Property 10: Isolamento de infraestrutura no capstone**
    - **Validates: Requirements 6.3, 6.4**

- [ ] 15. Checkpoint — Frente B concluída
  - Garantir que todos os testes passam; perguntar ao usuário em caso de dúvidas.

- [ ] 16. Frente C — Revisão didática (preservando os pilares)
  - [ ] 16.1 Preservar predição ativa e gabarito recolhido nos workbooks
    - Corrigir: garantir em cada workbook o ciclo Objetivo → Hipótese → Faça → Observe → Reflexão/Gabarito com o gabarito em bloco `<details><summary>`; não remover etapas; em reescritas, preservar fenômeno-antes-da-definição
    - _Requirements: 7.1, 7.4, 9.3, 9.5_

  - [ ] 16.2 Validar correspondência de diagramas Mermaid/C4 com o código do lab
    - Corrigir: validar sintaxe e conferir nó a nó que componentes, portas e adaptadores do diagrama existem com os mesmos nomes no `lab/`; corrigir diagrama (ou legenda) em caso de divergência, sem remover
    - _Requirements: 7.2_

  - [ ] 16.3 Garantir tom sênior e caminhos relativos
    - Corrigir: manter tom sênior-para-sênior e instruções precisas; substituir qualquer caminho absoluto de máquina por caminho relativo nas lições e workbooks
    - _Requirements: 7.3_

- [ ] 17. Frente D — Consistência estrutural e links
  - [ ] 17.1 Validar e corrigir cross-links README/docs/lab
    - Diagnosticar: percorrer cada link interno (`[texto](caminho)` e âncoras `#secao`) entre `README.md`, `docs/` e `lab/`
    - Corrigir: apontar links quebrados para o destino existente, nunca remover silenciosamente
    - _Requirements: 8.1, 8.4_

  - [ ] 17.2 Sincronizar artefatos de build com o código real
    - Corrigir: alinhar `package.json` (scripts), `Makefile`, `Dockerfile` e `docker-compose.yml`; conferir que hosts/portas/credenciais de desenvolvimento do compose batem com o que o Nível Opt-in espera via `process.env`; garantir ausência de segredos reais no VCS
    - _Requirements: 8.2, 9.6_

- [ ] 18. Checkpoint final — Frentes C e D concluídas
  - Garantir que todos os testes passam; perguntar ao usuário em caso de dúvidas.

## Notes

- Tarefas marcadas com `*` são testes (propriedade, unidade, integração) e podem ser puladas para um MVP mais rápido; o Auditor não deve implementá-las automaticamente.
- Cada tarefa referencia requisitos específicos para rastreabilidade e segue o Ciclo DCE (Diagnosticar → Corrigir → Evidenciar).
- Os checkpoints asseguram validação incremental ao fim de cada frente/bloco de fases.
- Testes de propriedade validam as 12 propriedades universais de correção do `design.md` (mínimo 100 iterações), no formato **Feature: arch-lab-audit, Property {n}**.
- Princípios invioláveis: complementar ≠ remover (nenhum conteúdo pedagógico apagado) e fenômeno-antes-da-definição preservado em toda reescrita; adições exigem nota de trade-off (Requirement 9.4).
- Prosa em pt-BR; identificadores, arquivos, testes, commits e código em inglês (Requirement 9.7).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3"] },
    { "id": 4, "tasks": ["2.4", "3.1"] },
    { "id": 5, "tasks": ["3.2", "3.3"] },
    { "id": 6, "tasks": ["5.1", "6.1", "7.1", "8.1", "9.1", "10.1", "12.1", "13.1", "14.1"] },
    { "id": 7, "tasks": ["10.2"] },
    { "id": 8, "tasks": ["5.2", "6.2", "8.2", "8.3", "9.2", "10.3", "10.4", "12.2", "13.2", "13.3", "14.2"] },
    { "id": 9, "tasks": ["16.1", "16.2", "16.3"] },
    { "id": 10, "tasks": ["17.1", "17.2"] }
  ]
}
```

# Requirements Document

## Introduction

Este documento define os requisitos para uma auditoria completa, correção de defeitos, refinamento arquitetural e revisão didática do repositório pedagógico **arch-lab** (TypeScript/Node.js 22 ESM, TypeScript 5 em modo estrito, Vitest). O escopo cobre as nove fases de laboratório (`lab/00` a `lab/08`), a documentação (`docs/journey`, `docs/workbooks`, `docs/reference`), os Architectural Decision Records (`adr/`) e a infraestrutura local (`docker-compose` com PostgreSQL 16 e Redis 7).

A auditoria preserva e reforça os quatro pilares inegociáveis do laboratório: fenômeno-antes-da-definição, predição ativa (Objetivo → Hipótese → Faça → Observe → Reflexão/Gabarito), o tripé pedagógico alinhado entre journey/workbooks/reference/lab, e zero hand-waving. O trabalho é organizado em quatro frentes de auditoria sequenciais (Qualidade de Código e Saúde dos Testes; Fidelidade Arquitetural por fase; Revisão Didática; Consistência Estrutural e Links), cada uma executada no ciclo Diagnosticar → Corrigir → Evidenciar. O princípio complementar-não-remover é absoluto: nenhuma lição, workbook ou laboratório é apagado, apenas melhorado ou substituído com justificativa.

A prosa de documentação permanece em português do Brasil; identificadores, nomes de arquivos, testes, mensagens de commit e código permanecem em inglês.

## Glossary

- **Auditor**: O agente responsável por executar a auditoria, correção, refinamento e revisão do repositório arch-lab.
- **Fase**: Cada um dos nove diretórios de laboratório `lab/00` a `lab/08`, cada qual demonstrando um conjunto de padrões arquiteturais.
- **Suíte Unitária**: O conjunto de testes executado por `npm test` (equivalente a `vitest run`), composto por testes unitários determinísticos e in-memory.
- **Suíte de Arquitetura**: O conjunto de Fitness Functions executado por `npm run test:arch`, que valida invariantes de arquitetura por análise de grafos de imports.
- **Teste de Integração**: Teste que depende de infraestrutura real (PostgreSQL 16 ou Redis 7) para execução.
- **Nível Opt-in**: Classe de testes de integração marcada para executar somente quando Docker e a infraestrutura real estão disponíveis, excluída das suítes sempre-verdes.
- **Fake Determinístico**: Implementação in-memory de uma porta de infraestrutura cujo comportamento é reprodutível sem dependências externas.
- **Fitness Function**: Teste automatizado que verifica programaticamente uma invariante arquitetural e reprova violações de design.
- **Pilar Pedagógico**: Cada uma das quatro regras invioláveis: fenômeno-antes-da-definição, predição ativa, tripé pedagógico e zero hand-waving.
- **Fenômeno-antes-da-definição**: Princípio que exige que o aluno observe o problema em código real antes da formalização teórica do conceito.
- **Predição Ativa**: Ciclo de workbook Objetivo → Hipótese → Faça → Observe → Reflexão/Gabarito, com gabarito recolhido em bloco `<details>`.
- **Tripé Pedagógico**: Alinhamento coerente entre journey, workbooks, reference e lab sobre um mesmo conceito.
- **Frente de Auditoria**: Cada um dos quatro eixos sequenciais de trabalho: Frente A (Código e Testes), Frente B (Fidelidade Arquitetural), Frente C (Didática), Frente D (Estrutura e Links).
- **Ciclo DCE**: A sequência Diagnosticar → Corrigir → Evidenciar aplicada a cada item de auditoria.
- **Modo Estrito**: A configuração `strict: true` do compilador TypeScript.

## Requirements

### Requirement 1: Saúde das suítes sempre-verdes (Frente A)

**User Story:** Como mantenedor do arch-lab, quero que as suítes unitária e de arquitetura passem de forma determinística em todas as fases, para que alunos e CI confiem no estado verde do repositório.

#### Acceptance Criteria

1. WHEN o comando `npm test` é executado, THE Suíte Unitária SHALL concluir com todos os testes aprovados em todas as fases de `lab/00` a `lab/08`.
2. WHEN o comando `npm run test:arch` é executado, THE Suíte de Arquitetura SHALL concluir com todos os testes aprovados.
3. WHILE a Suíte Unitária e a Suíte de Arquitetura estão em execução, THE Auditor SHALL manter a execução 100% in-memory, sem dependência de PostgreSQL 16 ou Redis 7.
4. IF um teste atualmente nas suítes sempre-verdes depende de infraestrutura real para execução, THEN THE Auditor SHALL refatorá-lo para um Fake Determinístico ou movê-lo para o Nível Opt-in.
5. WHEN o Auditor conclui a Frente A em uma fase, THE Auditor SHALL registrar a evidência da execução verde de `npm test` e `npm run test:arch` para aquela fase.

### Requirement 2: Eliminação de testes falso-positivos e tipagem insegura (Frente A)

**User Story:** Como revisor de qualidade, quero remover testes que passam sem verificar comportamento e tipagens inseguras sob modo estrito, para que os testes comprovem invariantes reais.

#### Acceptance Criteria

1. WHERE um teste é identificado como falso-positivo por não asserir o comportamento que afirma validar, THE Auditor SHALL corrigir o teste para asserir o comportamento real ou substituí-lo por teste equivalente que o faça.
2. WHERE o código ou os testes de uma fase usam `any` injustificado ou casts perigosos sob Modo Estrito, THE Auditor SHALL substituir cada ocorrência por tipagem explícita e segura.
3. WHEN o comando `npm run lint` (equivalente a `tsc --noEmit`) é executado, THE Auditor SHALL obter conclusão sem erros de tipo.
4. IF a remoção de um cast ou `any` exige mudança de contrato de uma porta, THEN THE Auditor SHALL ajustar a porta mantendo o isolamento do domínio.

### Requirement 3: Estabilidade de testes assíncronos e de concorrência (Frente A)

**User Story:** Como mantenedor, quero que testes de Outbox, Sagas, condições de corrida e Circuit Breaker sejam determinísticos, para que não ocorram falhas intermitentes.

#### Acceptance Criteria

1. WHERE testes assíncronos ou de concorrência nas fases de Outbox, Sagas, condições de corrida e Circuit Breaker apresentam intermitência, THE Auditor SHALL torná-los determinísticos por controle explícito de tempo, sincronização ou fakes.
2. WHEN um teste de concorrência previamente intermitente é executado 10 vezes consecutivas, THE Auditor SHALL obter 10 resultados idênticos de aprovação.
3. THE Auditor SHALL evitar atrasos baseados em tempo real de parede em testes determinísticos, usando relógios ou agendadores controláveis.

### Requirement 4: Fidelidade arquitetural das fases 00 a 02 (Frente B)

**User Story:** Como arquiteto, quero que Fitness Functions, métricas de modularidade e a arquitetura hexagonal estejam corretas, para que cada fase prove o padrão que ensina.

#### Acceptance Criteria

1. WHEN uma violação de camada é introduzida no código de amostra da fase 00, THE Fitness Function SHALL reprovar com falha de teste.
2. THE Auditor SHALL garantir que as métricas de Martin da fase 01 — Instabilidade (I), Abstração (A) e Distância (D) — sejam computadas conforme as fórmulas canônicas.
3. WHERE o domínio da fase 02 importa frameworks ou acesso a banco de dados, THE Auditor SHALL remover o acoplamento de modo que o domínio dependa somente de portas.
4. THE Auditor SHALL manter na fase 02 a separação estrita entre portas primárias (driving) e secundárias (driven) e seus adaptadores correspondentes.

### Requirement 5: Fidelidade arquitetural das fases 03 a 05 (Frente B)

**User Story:** Como arquiteto, quero DDD tático, CQRS/Event Sourcing e EDA/Outbox corretos, para que persistência e eventos sigam as invariantes dos padrões.

#### Acceptance Criteria

1. THE Auditor SHALL garantir que o Aggregate Root da fase 03 proteja suas invariantes e que os Value Objects sejam imutáveis e autovalidantes, sem modelo anêmico.
2. THE Auditor SHALL garantir que a fase 04 mantenha separação entre modelo de escrita (comandos) e modelo de leitura (projeções), com event store append-only e replay determinístico.
3. WHEN a fase 05 apresenta o problema de dual-write, THE Auditor SHALL demonstrar o fenômeno em código antes de apresentar a solução de Transactional Outbox.
4. THE Auditor SHALL garantir que o polling e o relay do Outbox da fase 05 sejam idempotentes para consumidores que recebem o mesmo evento mais de uma vez.

### Requirement 6: Fidelidade arquitetural das fases 06 a 08 (Frente B)

**User Story:** Como arquiteto, quero Sagas, padrões de resiliência e o capstone corretos, para que transações distribuídas e resiliência tenham semântica de produção.

#### Acceptance Criteria

1. THE Auditor SHALL garantir que as compensações da Saga da fase 06 sejam idempotentes e cubram falhas em estados intermediários.
2. THE Auditor SHALL garantir que a fase 07 implemente Circuit Breaker, Bulkhead, Retry com Backoff e Jitter, e Throttling com semântica de produção.
3. THE Auditor SHALL garantir que o capstone da fase 08 integre, em um checkout distribuído coeso, os conceitos de Hexagonal, DDD, Saga orquestrada com compensação, Transactional Outbox e Fitness Functions.
4. WHERE a infraestrutura é acoplada ao núcleo de negócio em qualquer serviço do capstone, THE Fitness Function SHALL reprovar o vazamento de infraestrutura.

### Requirement 7: Revisão didática e predição ativa (Frente C)

**User Story:** Como aluno de nível sênior, quero workbooks com predição antes da solução, diagramas válidos e instruções precisas, para que a aprendizagem seja ativa e verificável.

#### Acceptance Criteria

1. THE Auditor SHALL manter em cada workbook o ciclo de Predição Ativa Objetivo → Hipótese → Faça → Observe → Reflexão/Gabarito, com o gabarito recolhido em bloco `<details><summary>`.
2. WHERE um diagrama Mermaid ou C4 está presente na documentação, THE Auditor SHALL garantir que o diagrama seja sintaticamente válido e corresponda ao código do laboratório que descreve.
3. THE Auditor SHALL manter o tom sênior-para-sênior e instruções precisas com caminhos relativos nas lições e workbooks.
4. THE Auditor SHALL preservar o pilar fenômeno-antes-da-definição em todo conteúdo revisado, apresentando a observação do problema antes da formalização teórica.

### Requirement 8: Consistência estrutural e links (Frente D)

**User Story:** Como mantenedor, quero cross-links coerentes e artefatos de build sincronizados com o código real, para que a navegação e a automação reflitam o repositório.

#### Acceptance Criteria

1. THE Auditor SHALL garantir cross-links corretos entre `README.md`, os documentos de `docs/` e os diretórios de `lab/`.
2. WHERE `package.json`, `Makefile`, `Dockerfile` ou `docker-compose.yml` referenciam scripts, caminhos ou serviços, THE Auditor SHALL mantê-los sincronizados com o código real das fases.
3. THE Auditor SHALL separar os Testes de Integração que exigem PostgreSQL 16 ou Redis 7 em um Nível Opt-in que executa somente quando Docker está disponível.
4. IF um link interno aponta para um arquivo ou seção inexistente, THEN THE Auditor SHALL corrigir o link para o destino correto.

### Requirement 9: Governança da auditoria e preservação pedagógica

**User Story:** Como mantenedor, quero que a auditoria siga sequenciamento por frente, ciclo de evidência e o princípio complementar-não-remover, para que o avanço seja rastreável e nenhum conteúdo pedagógico seja perdido.

#### Acceptance Criteria

1. THE Auditor SHALL executar as Frentes de Auditoria na ordem A → B → C → D, abrangendo todas as fases dentro de cada frente.
2. WHEN o Auditor processa um item de auditoria, THE Auditor SHALL aplicar o Ciclo DCE Diagnosticar → Corrigir → Evidenciar.
3. THE Auditor SHALL preservar toda lição, workbook e laboratório existente, aplicando somente melhoria ou substituição, sem exclusão de conteúdo pedagógico.
4. WHERE o Auditor adiciona novos testes, Fitness Functions, ADRs ou seções de workbook, THE Auditor SHALL registrar a justificativa de trade-off da adição.
5. WHERE o Auditor reescreve um laboratório, teste ou diagrama que viola um padrão da fase ou ensina de forma incorreta, THE Auditor SHALL preservar o pilar fenômeno-antes-da-definição na versão reescrita.
6. THE Auditor SHALL manter o repositório livre de segredos, sem credenciais, senhas ou arquivos `.env` reais no controle de versão.
7. THE Auditor SHALL manter a prosa de documentação em português do Brasil e identificadores, nomes de arquivos, testes, commits e código em inglês.

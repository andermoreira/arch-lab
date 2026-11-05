# ROADMAP — arch-lab: Matriz Curricular Completa (Do Pleno ao Principal Engineer)

Este documento descreve a matriz curricular completa do **arch-lab**, estruturada em 3 blocos temáticos e 9 fases progressivas (Fase 0 a Fase 8).

---

## 🏛️ BLOCO 1: Fundamentos, Modularidade & Arquitetura Limpa

### Fase 0 — O Papel do Arquiteto, Trade-offs & Fitness Functions
- **Objetivo:** Compreender a natureza das decisões arquiteturais (decisões difíceis de reverter), balanceamento de Atributos de Qualidade (NFRs) e automação de governança arquitetural com testes contínuos.
- **Tópicos:**
  - O papel do Arquiteto de Software vs Tech Lead vs Staff Engineer.
  - Atributos de Qualidade (Disponibilidade, Latência, Escalabilidade, Manutenibilidade, Custo).
  - Documentação Viva: Architectural Decision Records (ADRs) no padrão Michael Nygard.
  - Modelagem C4 (Contexto, Contêineres, Componentes, Código) em Mermaid.
  - Fitness Functions Automatizadas: Como garantir que regras de isolamento de camadas nunca regridam no CI.
- **Entregável do Lab:** [`lab/00-fitness-functions/`](../lab/00-fitness-functions) — Motor de Fitness Functions que valida violações de camadas (varredura dos imports do código, sem AST) e detecta dependências circulares em um grafo de módulos (`findDependencyCycles`).

### Fase 1 — Princípios de Modularidade, Coesão & Acoplamento
- **Objetivo:** Dominar as métricas formais de acoplamento e os princípios que regem a estabilidade de pacotes e componentes em sistemas corporativos.
- **Tópicos:**
  - Coesão (LCOM - Lack of Cohesion in Methods) vs Acoplamento.
  - Métricas de Robert C. Martin:
    - Acoplamento Aferente ($C_a$): Quem depende de mim?
    - Acoplamento Eferente ($C_e$): De quem eu dependo?
    - Instabilidade ($I = \frac{C_e}{C_a + C_e}$): Faixa de $0$ (máxima estabilidade) a $1$ (máxima instabilidade).
    - Abstração ($A = \frac{N_a}{N_c}$): Proporção de interfaces/classes abstratas.
    - Distância da Sequência Principal ($D = |A + I - 1|$): Identificação de *Zona da Dor* e *Zona da Inutilidade*.
  - Princípios de Pacotes:
    - Stable Dependencies Principle (SDP): Dependa apenas na direção da estabilidade ($I_{dependente} \ge I_{dependência}$).
    - Stable Abstractions Principle (SAP): Um pacote deve ser tão abstrato quanto é estável ($A \approx 1 - I$).
    - Dependency Inversion Principle (DIP): Módulos de alto nível não devem depender de módulos de baixo nível.
- **Entregável do Lab:** [`lab/01-modularity-metrics/`](../lab/01-modularity-metrics) — Analisador de grafos de dependência que calcula $C_a$, $C_e$, $I$, $A$ e $D$.

### Fase 2 — Arquitetura Hexagonal (Ports & Adapters) & Clean Architecture
- **Objetivo:** Libertar as regras de negócio do acoplamento tóxico com frameworks, drivers de banco de dados e protocolos de rede.
- **Tópicos:**
  - As falhas do modelo N-Tier tradicional (*Database-Driven Design*): Acoplamento do schema relacional à lógica de negócio.
  - Arquitetura Hexagonal (Alistair Cockburn):
    - O Domínio como centro do universo.
    - Portas Primárias (Driving/Inbound): Casos de uso e comandos da aplicação.
    - Portas Secundárias (Driven/Outbound): Repositórios, Gateways externos, Mensageria.
    - Adaptadores: HTTP Controllers, CLI, PostgreSQL, Redis, Stripe, InMemory Mocks.
  - Clean Architecture (Robert C. Martin): A Regra da Dependência estrita apontando para o interior.
- **Entregável do Lab:** [`lab/02-hexagonal-architecture/`](../lab/02-hexagonal-architecture) — Refatoração de um sistema acoplado ao Postgres para Hexagonal pura com múltiplos adaptadores intercambiáveis sem alterar uma linha de domínio.

---

## ⚙️ BLOCO 2: Domain-Driven Design, CQRS & Mensageria Resiliente

### Fase 3 — Domain-Driven Design (DDD) Estratégico & Tático
- **Objetivo:** Modelar sistemas complexos alinhando software e negócio, estabelecendo fronteiras semânticas e invariantes transacionais à prova de inconsistência.
- **Tópicos:**
  - *DDD Estratégico:*
    - Subdomínios: Core Domain (vantagem competitiva), Supporting (suporte), Generic (commodities).
    - Bounded Contexts e Linguagem Ubíqua.
    - Context Mapping: Shared Kernel, Customer-Supplier, Conformist, Anti-Corruption Layer (ACL), Open Host Service (OHS).
  - *DDD Tático:*
    - Entidades vs Value Objects (imutabilidade, igualdade por atributos).
    - Agregados e Aggregate Roots: Garantia de limites transacionais e invariantes de negócio.
    - Domain Events e Domain Services.
    - Anti-Corruption Layer na prática: Isolamento de payloads legados/externos.
- **Entregável do Lab:** [`lab/03-domain-driven-design/`](../lab/03-domain-driven-design) — Refatoração de Modelo Anêmico para Modelo Rico com Aggregate Roots, Value Objects rigorosos e ACL.

### Fase 4 — Padrões de Persistência, CQRS & Event Sourcing
- **Objetivo:** Escalar operações de escrita e leitura de forma independente e obter rastreabilidade contábil inegociável através de logs imutáveis de eventos.
- **Tópicos:**
  - O dilema do modelo único: Conflitos de modelagem entre escrita (normalizada/invariantes) e leitura (desnormalizada/performance).
  - CQRS (Command Query Responsibility Segregation):
    - Lado de Comando: Validações, transações, mutação controlada.
    - Lado de Consulta: Projeções de leitura otimizadas, denormalizadas e assíncronas.
  - Event Sourcing:
    - Armazenamento em log imutável de eventos (*Append-Only Event Store*).
    - Reconstrução de estado via *Event Replay*.
    - Otimização de performance com Snapshots.
    - Concorrência Otimista com controle de versão de streams (`expectedVersion`).
  - Análise de Trade-offs: Complexidade acidental vs benefícios reais de auditoria e alta escala.
- **Entregável do Lab:** [`lab/04-cqrs-event-sourcing/`](../lab/04-cqrs-event-sourcing) — Sistema de conta corrente bancária com Event Store append-only, Projeções de saldo e extrato em tempo real, e controle de versão concorrente.

### Fase 5 — Arquiteturas Orientadas a Eventos (EDA) & Mensageria Resiliente
- **Objetivo:** Construir sistemas desacoplados no tempo e no espaço, garantindo entrega confiável de mensagens em redes não confiáveis.
- **Tópicos:**
  - Classificação de Eventos: Event Notification vs Event-Carried State Transfer (ECST) vs Event Collaboration.
  - A Armadilha do Dual-Write: Por que salvar no banco e publicar na fila sem transação atômica gera perda de dados silenciosa.
  - Padrão Transactional Outbox:
    - Tabela Outbox no mesmo commit da transação de negócio.
    - Outbox Poller / Debezium CDC Relay para publicação garantida (*At-Least-Once Delivery*).
  - Padrão Idempotent Consumer: Deduplicação de eventos usando chave de idempotência e tabela de mensagens processadas.
  - Teoremas Distribuídos: Teorema CAP (Consistência vs Disponibilidade) e PACELC (Trade-offs sob partição vs sob latência).
- **Entregável do Lab:** [`lab/05-eda-and-outbox/`](../lab/05-eda-and-outbox) — Simulação de falha de dual-write e implementação do Transactional Outbox + Idempotent Consumer com garantia de entrega exata.

---

## 🚀 BLOCO 3: Sistemas Distribuídos, Resiliência & Capstone Sênior

### Fase 6 — Transações Distribuídas & O Padrão Saga
- **Objetivo:** Coordenar transações que abrangem múltiplos microsserviços sem recorrer a locks bloqueantes de 2PC (Two-Phase Commit).
- **Tópicos:**
  - Por que Two-Phase Commit (2PC / XA) é um gargalo de disponibilidade e latência na nuvem.
  - O Padrão Saga: Sequência de transações locais que atualizam dados e emitem eventos.
  - Estratégias de Coordenação:
    - Coreografia: Serviços reagem a eventos uns dos outros (baixo acoplamento inicial, alta complexidade de rastreamento).
    - Orquestração: Um coordenador central com Máquina de Estados gerencia a execução e passos.
  - Transações Compensatórias (*Compensating Transactions*): Ações de desfazimento semântico para reverter etapas anteriores quando uma etapa intermediária falha.
  - Invariantes em Sagas: Como lidar com leituras sujas (*dirty reads*) e estados intermediários.
- **Entregável do Lab:** [`lab/06-distributed-sagas/`](../lab/06-distributed-sagas) — Orquestrador de Saga com Máquina de Estados para checkout de compras com compensação automática de estoque e crédito em falha de pagamento.

### Fase 7 — Resiliência, Escalabilidade & Padrões Distribuídos
- **Objetivo:** Evitar falhas em cascata, proteger recursos finitos e otimizar latência em sistemas de alta volumetria.
- **Tópicos:**
  - Padrões de Resiliência:
    - Circuit Breaker: Estados `CLOSED`, `OPEN`, `HALF_OPEN`, limiar de falhas e janela de recuperação.
    - Bulkhead: Isolamento de pools de conexões e threads para impedir que a lentidão de um terceiro derrube o sistema inteiro.
    - Rate Limiting: Algoritmos Token Bucket, Leaky Bucket e Sliding Window.
    - Retry com Exponential Backoff e Jitter (prevenção de tempestades de reconexão sincronizadas).
  - Estratégias de Cache Avançadas:
    - Cache-Aside (Lazy Loading), Write-Through, Write-Behind.
    - Prevenção de Cache Stampede / Thundering Herd usando Mutex de Single-Flight.
  - Backpressure e Degradação Graciosa de Serviços.
- **Entregável do Lab:** [`lab/07-resilience-patterns/`](../lab/07-resilience-patterns) — Suíte completa de resiliência com Circuit Breakers reativos, Bulkheads e proteção de Cache Stampede sob concorrência intensa.

### Fase 8 — Capstone Sênior: Arquitetura Corporativa de E-commerce
- **Objetivo:** Integrar todos os padrões em uma arquitetura corporativa realista de checkout distribuído de alta concorrência.
- **Tópicos:**
  - Múltiplos Bounded Contexts: `OrderContext`, `PaymentContext`, `InventoryContext`.
  - Arquitetura Hexagonal no core de cada Bounded Context.
  - Orquestração de Saga com compensação transacional robusta.
  - Transactional Outbox Pattern para propagação de eventos de domínio.
  - Fitness Functions contínuas que impedem qualquer violação de fronteira entre contextos.
- **Entregável do Lab:** [`lab/08-capstone-enterprise-checkout/`](../lab/08-capstone-enterprise-checkout) — Sistema corporativo completo com cobertura total de testes unitários, testes de integração e Fitness Functions.

# AGENTS.md — arch-lab

Laboratório prático de referência e excelência em **Arquitetura de Software e Engenharia de Sistemas Corporativos**, estruturado do nível intermediário/pleno até o nível de Arquiteto de Software Sênior / Principal / Staff Engineer.

Prosa de documentação e orientação ao aluno em pt-BR; identificadores, nomes de arquivos, testes, commits e código em inglês.

---

## 1. Regras Invioláveis & Filosofia Pedagógica

- **Educação como pilar supremo:** O objetivo não é apenas desenhar diagramas conceituais, mas provar a eficácia de cada padrão arquitetural através de código real, trade-offs mensuráveis e testes automatizados.
- **Fenômeno antes da definição:** O aluno deve presenciar o acoplamento *Database-Driven* travando mudanças de negócio, o efeito dominó de falhas em cascata sem *Circuit Breakers*, inconsistência financeira por falta de *Sagas* com compensação, ou a violação de fronteiras detectada por *Fitness Functions* antes da formalização teórica.
- **Predição Ativa nos Workbooks:** Todo exercício prático exige o ciclo:
  $$\text{Objetivo} \longrightarrow \text{Hipótese} \longrightarrow \text{Faça} \longrightarrow \text{Observe} \longrightarrow \text{Reflexão/Gabarito}$$
- **Gabaritos recolhidos:** O resultado esperado e a explicação ficam fora do fluxo visual imediato (usar tags `<details><summary>Ver explicação e gabarito</summary>...</details>`) para forçar o raciocínio ativo.
- **Zero Hand-waving:** Todo padrão arquitetural (Hexagonal, Clean Architecture, CQRS, Event Sourcing, Transactional Outbox, Sagas, Circuit Breaker) deve ter implementação funcional com testes unitários, testes de integração e Fitness Functions comprovando invariantes.
- **Complementar ≠ Remover:** Nunca apagar lições, workbooks ou labs para "enxugar" o repositório. O avanço pedagógico se dá por refinamento e andaimes (*scaffolding*).
- **Sem segredos no repositório:** Nenhuma credencial, senha ou `.env` real no controle de versão.

---

## 2. O Tripé Pedagógico

A arquitetura do repositório organiza o conteúdo em quatro papéis bem delimitados:

| Papel | Onde vive | Função Pedagógica |
|---|---|---|
| **Jornada** | `docs/journey/` | Sequência linear guiada do aluno: pergunta do módulo, pré-requisitos, fatia de leitura e checkpoints observáveis. |
| **Workbooks** | `docs/workbooks/` | Exercícios práticos guiados no modelo preditivo (*hipótese → faça → observe → reflexão*). |
| **Referência** | `docs/reference/` | Catálogo técnico profundo e estável (diagramas C4, métricas de acoplamento, teoremas CAP/PACELC, trade-offs). |
| **Laboratórios** | `lab/` | Código TypeScript/Node.js executável, testável via Vitest, Docker, Postgres e Redis. |

---

## 3. Matriz Curricular em Espiral (Fases 0 a 8)

1. **Fase 0 — O Papel do Arquiteto, Trade-offs & Fitness Functions:**
   - O que é Arquitetura de Software: Decisões difíceis de reverter, Atributos de Qualidade (NFRs) e Trade-offs.
   - Testes de Arquitetura Automatizados (Fitness Functions / ArchUnit / linters de camadas impedindo violações de design).
   - Documentação Viva: Architectural Decision Records (ADRs) e Modelagem C4 (Context, Containers, Components, Code).
2. **Fase 1 — Princípios de Modularidade, Coesão & Acoplamento:**
   - Métricas de Robert C. Martin: Acoplamento Aferente ($C_a$), Acoplamento Eferente ($C_e$), Instabilidade ($I$), Abstração ($A$) e Distância da Sequência Principal ($D$).
   - SOLID na Arquitetura (com foco em Inversão de Dependências - DIP).
   - Princípio de Dependências Estáveis (SDP) e Princípio de Abstrações Estáveis (SAP).
3. **Fase 2 — Arquitetura Hexagonal (Ports & Adapters) & Clean Architecture:**
   - Armadilhas do modelo *Database-Driven Design* N-Tier tradicional.
   - Arquitetura Hexagonal (Alistair Cockburn): Domínio no centro, Portas Primárias/Secundárias e Adaptadores (Driving vs Driven).
   - Clean Architecture (Robert C. Martin): A Regra da Dependência estrita apontando para o core de negócio.
4. **Fase 3 — Domain-Driven Design (DDD) Estratégico & Tático:**
   - *DDD Estratégico:* Linguagem Ubíqua, Subdomínios (Core, Supporting, Generic), Bounded Contexts e Context Mapping (Shared Kernel, Customer-Supplier, ACL).
   - *DDD Tático:* Entidades (identidade única), Value Objects (imutabilidade estrutural), Agregados e Aggregate Roots garantindo invariantes transacionais, Domain Events e Domain Services.
5. **Fase 4 — Padrões de Persistência, CQRS & Event Sourcing:**
   - CQRS: Separação estrita entre modelo de mutação de comandos e modelo de projeção otimizado para leitura.
   - Event Sourcing: Estado reconstruído a partir de log imutável de eventos (Append-only Event Store), Projeções e Replay.
   - Trade-offs: Quando CQRS/Event Sourcing agrega valor e quando vira acidental complexity.
6. **Fase 5 — Arquiteturas Orientadas a Eventos (EDA) & Mensageria Resiliente:**
   - EDA: Event Notifications, Event-Carried State Transfer e Event Collaboration.
   - Padrões de Entrega Garantida: Transactional Outbox Pattern (eliminação de dual-write) e Idempotent Consumer.
   - Teorema CAP e Teorema PACELC aplicados ao design de dados distribuídos.
7. **Fase 6 — Transações Distribuídas & O Padrão Saga:**
   - Por que 2PC (Two-Phase Commit) não escala em microsserviços modernos.
   - Padrão Saga: Orquestração (Máquina de Estados) vs Coreografia (Eventos descentralizados).
   - Transações Compensatórias (*Compensating Transactions*) para rollback consistente.
8. **Fase 7 — Resiliência, Escalabilidade & Padrões Distribuídos:**
   - Resiliência: Circuit Breaker, Bulkhead, Rate Limiting e Retry com Backoff + Jitter.
   - Estratégias de Cache Avançadas (Cache-Aside, Write-Through, Write-Behind, prevenção de Cache Stampede e Thundering Herd).
   - Backpressure e Degradação Graciosa de Serviços.
9. **Fase 8 — Capstone Sênior: Arquitetura Corporativa de E-commerce:**
   - Sistema de ponta a ponta: Múltiplos Bounded Contexts (Pedidos, Pagamentos, Estoque), Arquitetura Hexagonal no core de cada serviço, Saga Orquestrada com compensação automática, Transactional Outbox e Fitness Functions impedindo vazamento de infraestrutura.

---

## 4. Estrutura de Diretórios

```text
arch-lab/
├── AGENTS.md                  # Regras pedagógicas e convenções do repositório
├── README.md                  # Apresentação e guia de início rápido
├── Makefile                   # Comandos de automação (test, test-arch, lint, docker)
├── Dockerfile                 # Contêiner Node.js 22 de desenvolvimento
├── docker-compose.yml         # Ambiente local (App, PostgreSQL 16, Redis 7)
├── package.json               # Configurações do projeto e scripts
├── tsconfig.json              # Configuração estrita do compilador TypeScript
├── vitest.config.ts           # Configuração do runner de testes
├── adr/                       # Architectural Decision Records (ADRs) canônicos
├── docs/                      # Documentação permanente do laboratório
│   ├── ROADMAP.md             # Matriz curricular completa (Fases 0 a 8)
│   ├── GLOSSARIO.md           # Modelos mentais, métricas e vocabulário técnico
│   ├── PEDAGOGICAL-AUDIT.md   # Rubrica de auditoria e qualidade das lições
│   ├── journey/               # Jornada de leitura linear guiada
│   ├── workbooks/             # Workbooks práticos com predição ativa
│   └── reference/             # Guias de referência profunda e diagramas C4
└── lab/                       # Código real e executável por fase
    ├── 00-fitness-functions/
    ├── 01-modularity-metrics/
    ├── 02-hexagonal-architecture/
    ├── 03-domain-driven-design/
    ├── 04-cqrs-event-sourcing/
    ├── 05-eda-and-outbox/
    ├── 06-distributed-sagas/
    ├── 07-resilience-patterns/
    └── 08-capstone-enterprise-checkout/
```

---

## 5. Convenções de Código e Testes

- **Runtime:** Node.js 22+ com ESM nativo (`"type": "module"`).
- **Linguagem:** TypeScript 5+ em modo estrito (`strict: true`).
- **Testes:** Vitest com suites de testes unitários (`.test.ts`), testes de integração e Fitness Functions de arquitetura.
- **Validação Arquitetural:** Regras de dependência testadas programaticamente via análise de grafos de imports.

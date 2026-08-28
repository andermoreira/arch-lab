# Guia de Referência 08: Catálogo de Padrões de Arquitetura Corporativa

## 1. Visão Geral da Arquitetura Corporativa de Referência

O **arch-lab** sintetiza os mais rigorosos padrões da indústria em uma arquitetura limpa, testável e escalável:

```mermaid
graph TD
    subgraph Enterprise_Architecture_Synthesis [Arquitetura de Referência arch-lab]
        FF[00. Fitness Functions - Governança Contínua]
        METRICS[01. Métricas de Martin - SDP / SAP / DIP]
        HEX[02. Arquitetura Hexagonal - Ports & Adapters]
        DDD[03. DDD Estratégico & Tático - Bounded Contexts]
        CQRS[04. CQRS & Event Sourcing - Append-Only Store]
        OUTBOX[05. EDA & Transactional Outbox - At-Least-Once]
        SAGA[06. Transações Distribuídas - Sagas Orquestradas]
        RES[07. Resiliência - Circuit Breaker & Single-Flight]
    end

    FF --> HEX
    METRICS --> HEX
    HEX --> DDD
    DDD --> CQRS
    DDD --> OUTBOX
    OUTBOX --> SAGA
    SAGA --> RES
```

---

## 2. Matriz de Decisão Arquitetural Corporativa

| Requisito do Sistema | Padrão Recomendado | Anti-Padrão a Evitar |
|---|---|---|
| Regras de negócio complexas | DDD Tático (Agregados Ricos, VOs) | Modelo Anêmico com Getters/Setters |
| Troca flexível de infraestrutura | Arquitetura Hexagonal (Portas Limpas) | ORMs acoplados diretamente ao Domínio |
| Rastreabilidade financeira / Auditoria | Event Sourcing com Append-Only Store | Operações destrutivas `UPDATE` / `DELETE` |
| Mensageria sem perda de dados | Transactional Outbox + Idempotent Consumer | Dual-Write ingênuo (Commit SQL + Publish Broker) |
| Transações entre múltiplos microsserviços | Sagas Orquestradas com Compensação | 2PC (Two-Phase Commit) com locks distribuídos |
| Proteção contra falhas em cascata | Circuit Breaker + Bulkhead + Single-Flight | Loops de retry síncronos sem backoff/jitter |
| Governança de código contínua | Fitness Functions no CI/CD | Confiança exclusiva em Code Review manual |

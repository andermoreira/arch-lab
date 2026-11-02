# A JORNADA DO ARQUITETO — arch-lab

> [!TIP]
> **Iniciante em Arquitetura de Software?** Comece pelo [Guia para Iniciantes](../INICIANTE.md) para construir intuição através de analogias da vida real (pilares de edifícios, disjuntores, tomadas de parede) e consulte o [Glossário com Analogias](../GLOSSARIO.md).

A **Jornada** é a trilha de leitura linear e progressão conceitual do **arch-lab**. Ela foi desenhada para guiar o engenheiro através de uma narrativa lógica, onde cada bloco resolve os problemas arquiteturais deixados em aberto pelo anterior.

---

## 🗺️ Mapa da Jornada

| Parte | Nome da Trilha | Fases Cobertas | Foco Principal |
|---|---|---|---|
| **Parte 1** | [Fundamentos, Métricas & Governança](file:///Users/andersonalves/dev/arch-lab/docs/journey/part-1-foundations-and-modularity.md) | Fases 0 e 1 | Papel do Arquiteto, C4 Model, Fitness Functions e Métricas de Robert C. Martin ($C_a, C_e, I, A, D$). |
| **Parte 2** | [Arquitetura Hexagonal, Clean & DDD](file:///Users/andersonalves/dev/arch-lab/docs/journey/part-2-hexagonal-clean-and-ddd.md) | Fases 2 e 3 | Fim do Database-Driven Design, Ports & Adapters, Clean Architecture, DDD Estratégico e Tático (Aggregates & Invariantes). |
| **Parte 3** | [Persistência, CQRS, Event Sourcing & EDA](file:///Users/andersonalves/dev/arch-lab/docs/journey/part-3-persistence-cqrs-and-eda.md) | Fases 4 e 5 | Segregação de Leitura/Escrita, Event Stores imutáveis, Eliminação do Dual-Write via Transactional Outbox e CAP/PACELC. |
| **Parte 4** | [Transações Distribuídas, Resiliência & Capstone](file:///Users/andersonalves/dev/arch-lab/docs/journey/part-4-distributed-sagas-resilience-and-capstone.md) | Fases 6, 7 e 8 | Sagas Orquestradas com Compensação, Circuit Breakers, Cache Stampede e Projeto Capstone Enterprise de Checkout. |

---

## 💡 Como Estudar

1. Leia a seção da **Jornada**.
2. Abra o **Workbook** correspondente em `docs/workbooks/` e formule sua hipótese antes de rodar os testes.
3. Consulte o catálogo de **Referência Técnica** em `docs/reference/` para aprofundamento formal e diagramas C4.
4. Execute e inspecione o código funcional em `lab/`.

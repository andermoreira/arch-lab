# 🏛️ arch-lab: Laboratório de Excelência em Arquitetura de Software & Engenharia de Sistemas Corporativos

Bem-vindo ao **arch-lab**, um laboratório prático de engenharia de software e arquitetura de sistemas corporativos, desenhado para elevar engenheiros de software do nível pleno/sênior ao nível de **Arquiteto de Software Sênior, Staff e Principal Engineer**.

---

## 🎯 Filosofia Pedagógica

O **arch-lab** rejeita o aprendizado puramente teórico de arquitetura ("desenhar caixinhas em slides"). Nosso método é fundamentado em quatro pilares inegociáveis:

1. **Fenômeno antes da Definição:** Você vê o sistema falhar, a concorrência travar ou a perda de dados ocorrer antes da formalização teórica do padrão.
2. **Predição Ativa:** Em cada workbook você formula uma hipótese antes de rodar os testes (`Objetivo → Hipótese → Faça → Observe → Reflexão/Gabarito`).
3. **Tripé Pedagógico:** Jornada guiada (`docs/journey/`) + Workbooks práticos (`docs/workbooks/`) + Referência técnica aprofundada com C4 (`docs/reference/`) + Labs executáveis em código real (`lab/`).
4. **Zero Hand-waving:** Cada padrão (Hexagonal, CQRS, Event Sourcing, Outbox, Sagas, Circuit Breakers, Fitness Functions) possui implementação funcional e testes automatizados.

---

## 🗺️ Matriz Curricular (Fases 0 a 8)

| Fase | Tema Central | Problema Prático Resolvido | Entregável no `lab/` |
|---|---|---|---|
| **0** | **O Papel do Arquiteto & Fitness Functions** | Regressão arquitetural silenciosa e acoplamento indevido | [`lab/00-fitness-functions/`](file:///Users/andersonalves/dev/arch-lab/lab/00-fitness-functions) |
| **1** | **Modularidade & Métricas de Martin** | Dependências cíclicas e instabilidade estrutural | [`lab/01-modularity-metrics/`](file:///Users/andersonalves/dev/arch-lab/lab/01-modularity-metrics) |
| **2** | **Arquitetura Hexagonal & Clean Arch** | Acoplamento *Database-Driven* travando regras de negócio | [`lab/02-hexagonal-architecture/`](file:///Users/andersonalves/dev/arch-lab/lab/02-hexagonal-architecture) |
| **3** | **DDD Estratégico & Tático** | Modelo Anêmico e violação de invariantes transacionais | [`lab/03-domain-driven-design/`](file:///Users/andersonalves/dev/arch-lab/lab/03-domain-driven-design) |
| **4** | **CQRS & Event Sourcing** | Contenção de escrita em relatórios e auditoria contábil | [`lab/04-cqrs-event-sourcing/`](file:///Users/andersonalves/dev/arch-lab/lab/04-cqrs-event-sourcing) |
| **5** | **EDA & Transactional Outbox** | Perda de mensagens por falha de dual-write | [`lab/05-eda-and-outbox/`](file:///Users/andersonalves/dev/arch-lab/lab/05-eda-and-outbox) |
| **6** | **Transações Distribuídas & Sagas** | Dinheiro duplicado / estoque órfão em microserviços | [`lab/06-distributed-sagas/`](file:///Users/andersonalves/dev/arch-lab/lab/06-distributed-sagas) |
| **7** | **Resiliência & Padrões Distribuídos** | Efeito dominó de falhas e *Thundering Herd* no cache | [`lab/07-resilience-patterns/`](file:///Users/andersonalves/dev/arch-lab/lab/07-resilience-patterns) |
| **8** | **Capstone: E-Commerce Corporativo** | Checkout distribuído multi-contexto com compensação | [`lab/08-capstone-enterprise-checkout/`](file:///Users/andersonalves/dev/arch-lab/lab/08-capstone-enterprise-checkout) |

---

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 22+ e npm 10+ (ou Docker & Docker Compose).

### Instalação & Execução Local

```bash
# 1. Clonar e instalar dependências
npm install

# 2. Executar toda a suíte de testes de arquitetura e laboratórios
npm test

# 3. Executar apenas as Fitness Functions automatizadas
npm run test:arch

# 4. Executar verificação de tipos estáticos
npm run lint
```

### Execução via Docker Compose

```bash
# Iniciar banco PostgreSQL 16 e Redis 7 com healthchecks
make docker-up

# Executar testes dentro do ambiente isolado
make docker-test

# Encerrar e limpar contêineres
make docker-down
```

---

## 📚 Estrutura da Documentação

- **Jornada Linear Guiada:** [`docs/journey/`](file:///Users/andersonalves/dev/arch-lab/docs/journey)
- **Workbooks Investigativos:** [`docs/workbooks/`](file:///Users/andersonalves/dev/arch-lab/docs/workbooks)
- **Catálogo de Referência Técnica & C4:** [`docs/reference/`](file:///Users/andersonalves/dev/arch-lab/docs/reference)
- **Architectural Decision Records:** [`adr/`](file:///Users/andersonalves/dev/arch-lab/adr)
- **Glossário de Modelos Mentais & Métricas:** [`docs/GLOSSARIO.md`](file:///Users/andersonalves/dev/arch-lab/docs/GLOSSARIO.md)
- **Rubrica de Auditoria Pedagógica:** [`docs/PEDAGOGICAL-AUDIT.md`](file:///Users/andersonalves/dev/arch-lab/docs/PEDAGOGICAL-AUDIT.md)

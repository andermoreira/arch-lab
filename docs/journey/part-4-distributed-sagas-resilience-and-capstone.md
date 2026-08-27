# Jornada — Parte 4: Transações Distribuídas (Sagas), Resiliência & Capstone Corporativo

## 🎯 Pergunta Condutora
> *"Como orquestrar transações atômicas de negócio em múltiplos microsserviços sem locks distribuídos e como proteger a infraestrutura contra falhas em cascata e tempestades de requisições?"*

---

## 1. Fase 6: Transações Distribuídas & O Padrão Saga

### Por que Two-Phase Commit (2PC) falha na nuvem?
O protocolo clássico 2PC bloqueia (*locks*) todos os recursos participantes durante as fases de preparação (*Prepare*) e efetivação (*Commit*). Se um nó sofrer lentidão ou partição de rede, todas as transações concorrentes entram em espera, gerando colapso de disponibilidade.

### A Alternativa Saga: Transações Locais + Compensação
Uma **Saga** é uma sequência de transações locais em cada serviço.
Se um passo falhar no meio do caminho, o Orquestrador executa **Transações Compensatórias** (*Compensating Transactions*) em ordem reversa:

```mermaid
stateDiagram-v2
    [*] --> CriandoPedido
    CriandoPedido --> ReservandoEstoque: Pedido Criado
    ReservandoEstoque --> ProcessandoPagamento: Estoque Reservado com Sucesso
    
    state PagamentoSucesso <<choice>>
    ProcessandoPagamento --> PagamentoSucesso
    
    PagamentoSucesso --> EnviandoMercadoria: Pagamento Aprovado
    EnviandoMercadoria --> SagaFinalizadaComSucesso: Envio Despachado
    SagaFinalizadaComSucesso --> [*]
    
    PagamentoSucesso --> CompensandoEstoque: Pagamento Recusado (Cartão Inválido)
    CompensandoEstoque --> CancelandoPedido: Estoque Devolvido
    CancelandoPedido --> SagaFinalizadaComFalhaCompensada: Pedido Cancelado
    SagaFinalizadaComFalhaCompensada --> [*]
```

---

## 2. Fase 7: Resiliência, Escalabilidade & Padrões Distribuídos

### Padrões Essenciais de Resiliência
1. **Circuit Breaker (Martin Fowler):**
   - `CLOSED`: Operação normal. Conta falhas consecutivas.
   - `OPEN`: Limiar excedido. Rejeita imediatamente sem chamar a dependência degradada (*fail fast*).
   - `HALF_OPEN`: Janela de teste. Permite chamadas limitadas para verificar se o serviço recuperou.
2. **Bulkhead Pattern:** Isola limites de concorrência por dependência (ex: 20 requisições simultâneas para o Gateway de Frete e 50 para o Gateway de Pagamentos).
3. **Cache Stampede / Thundering Herd:**
   - Problema: 1000 requisições concorrentes chegam no milissegundo em que a chave de cache expira. Todas as 1000 chamadas batem no banco de dados, derrubando o PostgreSQL.
   - Solução: **Single-Flight Mutex Lock** — apenas a primeira requisição vai ao banco; as outras 999 aguardam a promessa do cache ser preenchida.

---

## 3. Fase 8: Capstone Sênior — E-commerce Corporativo Completo

No Capstone corporativo, integramos todos os pilares em um sistema de ponta a ponta:
- Três Bounded Contexts isolados: `Orders`, `Payments`, `Inventory`.
- Núcleo de domínio puro com Arquitetura Hexagonal.
- Orquestração de Saga com Máquina de Estados e compensações transacionais testadas.
- Transactional Outbox para propagação de eventos.
- Fitness Functions validando a ausência de vazamento de acoplamento entre contextos.

---

## 🔬 Checkpoint Prático da Parte 4

Execute o laboratório e complete os workbooks:
- Workbook: [`docs/workbooks/06-distributed-sagas-workbook.md`](file:///Users/andersonalves/dev/arch-lab/docs/workbooks/06-distributed-sagas-workbook.md)
- Lab: [`lab/06-distributed-sagas/`](file:///Users/andersonalves/dev/arch-lab/lab/06-distributed-sagas)
- Workbook: [`docs/workbooks/07-resilience-patterns-workbook.md`](file:///Users/andersonalves/dev/arch-lab/docs/workbooks/07-resilience-patterns-workbook.md)
- Lab: [`lab/07-resilience-patterns/`](file:///Users/andersonalves/dev/arch-lab/lab/07-resilience-patterns)
- Workbook: [`docs/workbooks/08-capstone-enterprise-checkout-workbook.md`](file:///Users/andersonalves/dev/arch-lab/docs/workbooks/08-capstone-enterprise-checkout-workbook.md)
- Lab: [`lab/08-capstone-enterprise-checkout/`](file:///Users/andersonalves/dev/arch-lab/lab/08-capstone-enterprise-checkout)

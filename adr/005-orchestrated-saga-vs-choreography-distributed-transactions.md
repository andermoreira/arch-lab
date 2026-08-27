# ADR 005: Transações Distribuídas com Padrão Saga Orquestrada

## Status
Accepted

## Data
2026-08-27

## Contexto
O processo de checkout e finalização de compras em um e-commerce corporativo envolve múltiplos Bounded Contexts (Pedidos, Estoque, Pagamento, Frete).
Transações clássicas distribuídas baseadas no protocolo Two-Phase Commit (2PC) bloqueiam tabelas em múltiplos nós durante toda a transação, tornando o sistema vulnerável a travamentos e gargalos severos de disponibilidade e latência.

Uma abordagem puramente coreografada (onde serviços reagem cegamente a eventos uns dos outros) gera alto acoplamento cíclico implícito e dificulta a visualização e depuração do fluxo de negócio.

## Decisão
Adotamos o **Padrão Saga Orquestrada com Máquina de Estados**:
1. Um componente **Saga Orchestrator** coordena o fluxo transacional disparando comandos específicos para cada microsserviço.
2. Cada serviço executa sua transação local e responde com sucesso ou falha.
3. Se qualquer etapa intermediária falhar (ex: cartão de crédito recusado no pagamento), o Orquestrador dispara sequencialmente as **Transações Compensatórias** (*Compensating Transactions*, ex: devolver reserva de estoque).
4. O estado da Saga é persistido em cada transição para garantir retomada em caso de crash.

## Consequências

### Positivas
- Ausência de locks distribuídos bloqueantes: cada serviço mantém alta disponibilidade e concorrência local.
- Visibilidade e rastreabilidade centralizada do ciclo de vida da transação distribuída.
- Garantia de consistência eventual sem recursos órfãos.

### Negativas / Mitigações
- Não há isolamento estrito ACID clássico: leituras intermediárias podem observar estados transitórios antes da compensação (mitigado por estados semânticos explícitos como `PENDING_PAYMENT` e `COMPENSATED`).

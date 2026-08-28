# Workbook 04: Padrões de Persistência, CQRS & Event Sourcing

## 🎯 Pergunta Condutora do Módulo
*Por que operações destrutivas `UPDATE` e `DELETE` destroem a rastreabilidade contábil e impedem auditoria legal em sistemas financeiros, e como o Event Sourcing com CQRS permite reconstruir o estado exato de qualquer momento no tempo?*

---

## 🧪 Exercício 1: Reconstrução de Estado via Replay de Event Log Imutável

### 1. Objetivo
Criar uma conta bancária, realizar múltiplos depósitos e saques, e reconstruir o saldo atual a partir do zero através do reprocessamento (*replay*) de eventos no Event Store.

### 2. Hipótese
Formule sua previsão:
- ( ) O Event Store salva uma linha com o saldo atualizado e sobrescreve o saldo anterior.
- ( ) O Event Store é um log estritamente **Append-Only** (nunca executa `UPDATE`). O saldo atual é o resultado determinístico da soma e subtração de todos os eventos da stream da conta.

### 3. Faça
Execute o teste do laboratório CQRS / Event Sourcing:
```bash
npx vitest run lab/04-cqrs-event-sourcing/cqrs-event-sourcing.test.ts
```

Inspecione a implementação do Event Store em [`lab/04-cqrs-event-sourcing/store/event-store.ts`](file:///Users/andersonalves/dev/arch-lab/lab/04-cqrs-event-sourcing/store/event-store.ts).

### 4. Observe
Veja o histórico de eventos gerados:
1. `AccountOpenedEvent` (saldo: R$ 0)
2. `MoneyDepositedEvent` (+ R$ 500)
3. `MoneyWithdrawnEvent` (- R$ 200)
4. `MoneyDepositedEvent` (+ R$ 100)
Ao executar `BankAccountAggregate.rehydrate(events)`, o estado é restaurado com saldo exato de R$ 400.

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**A Força do Event Sourcing:**
- **Auditoria Perfeita:** Nada é esquecido ou sobrescrito. Você sabe exatamente QUEM fez, QUANDO fez e POR QUE fez.
- **Time Travel Debugging:** Você pode reconstituir o estado do sistema exatamente como ele estava há 3 meses atrás, apenas filtrando eventos até aquela data.
- **Correção Retroativa:** Em caso de bug em uma regra de cálculo, você corrige o código e reprocessa o log de eventos histórico.
</details>

---

## 🧪 Exercício 2: Concorrência Otimista com `expectedVersion`

### 1. Objetivo
Simular duas operações simultâneas tentando gravar eventos na mesma conta bancária ao mesmo tempo, e observar a detecção e rejeição de conflito de concorrência.

### 2. Hipótese
Se duas requisições lerem a conta na versão 3 e tentarem gravar novos eventos esperando a versão 3:
- ( ) Ambas serão gravadas gerando inconsistência silenciosa.
- ( ) A primeira requisição terá sucesso (avançando a stream para a versão 4) e a segunda será rejeitada com erro `ConcurrencyException: Conflito de versão esperada`.

### 3. Faça
Inspecione o método `appendEvents` em [`lab/04-cqrs-event-sourcing/store/event-store.ts`](file:///Users/andersonalves/dev/arch-lab/lab/04-cqrs-event-sourcing/store/event-store.ts).

### 4. Observe
O controle otimista de versão impede o problema de *Lost Update* sem necessidade de locks pessimistas bloqueantes no banco de dados.

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**CQRS: Separando Comandos de Projeções:**
- **Command Side (Escrita):** Otimizado para invariantes, integridade e append-only de alta velocidade.
- **Query Side (Leitura):** Ouve os eventos e atualiza tabelas desnormalizadas ou índices no Redis/Elasticsearch (`AccountBalanceProjection`), permitindo leituras com $O(1)$ sem JOINs pesados.
</details>

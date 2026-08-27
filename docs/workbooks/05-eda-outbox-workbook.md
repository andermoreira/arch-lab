# Workbook 05: EDA & Transactional Outbox Pattern

## 🎯 Pergunta do Módulo
Por que fazer commit no banco e em seguida chamar o broker de mensageria gera perda de mensagens sob falhas de rede, e como o Transactional Outbox elimina o Dual-Write?

---

## 🧪 Exercício 1: Comparando Dual-Write Falho vs Outbox Atômico

### 1. Objetivo
Simular uma falha de rede logo após o commit do banco e verificar que o Dual-Write perde a mensagem, enquanto o Transactional Outbox recupera e publica o evento com sucesso.

### 2. Hipótese
Formule sua previsão:
- *O que acontece no Transactional Outbox quando o broker cai momentaneamente durante a execução do Relay?*

### 3. Faça
Execute o teste do Transactional Outbox:
```bash
npx vitest run lab/05-eda-and-outbox/outbox.test.ts
```

Inspecione os arquivos em [`lab/05-eda-and-outbox/`](file:///Users/andersonalves/dev/arch-lab/lab/05-eda-and-outbox).

### 4. Observe
Veja que a tabela de Outbox retém a mensagem no estado `PENDING` até o broker voltar, e o `IdempotentConsumer` descarta cópias duplicadas enviadas em retries.

### 5. Reflexão & Gabarito
<details>
<summary>Ver explicação e gabarito</summary>

**Garantia de Entrega:**
- O Transactional Outbox garante entrega *At-Least-Once*.
- Para fechar o ciclo de consistência, o consumidor deve obrigatoriamente ser um *Idempotent Consumer*, registrando as chaves de mensagens já processadas.

</details>

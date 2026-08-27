# Workbook 07: Resiliência & Padrões Distribuídos

## 🎯 Pergunta do Módulo
Como proteger seus microsserviços contra falhas em cascata de terceiros (usando Circuit Breakers) e como impedir que o banco caia quando uma chave de cache expira sob alta concorrência (Cache Stampede)?

---

## 🧪 Exercício 1: Circuit Breaker & Single-Flight Cache Mutex

### 1. Objetivo
Simular 100 requisições simultâneas em um gateway instável com Circuit Breaker e testar a proteção contra Thundering Herd em cache expirado.

### 2. Hipótese
Formule sua previsão:
- *Quantas consultas ao banco de dados serão feitas se 50 threads concorrentes solicitarem simultaneamente um dado que acabou de expirar no cache, usando Single-Flight Mutex?*

### 3. Faça
Execute a suíte de testes de resiliência:
```bash
npx vitest run lab/07-resilience-patterns/resilience.test.ts
```

Inspecione os arquivos em [`lab/07-resilience-patterns/`](file:///Users/andersonalves/dev/arch-lab/lab/07-resilience-patterns).

### 4. Observe
Veja o Circuit Breaker transitando entre `CLOSED` → `OPEN` → `HALF_OPEN` → `CLOSED`.
Observe que apenas 1 requisição bateu no banco durante o Cache Stampede; as outras 49 esperaram a mesma promessa.

### 5. Reflexão & Gabarito
<details>
<summary>Ver explicação e gabarito</summary>

**Padrões de Alta Concorrência:**
- O Circuit Breaker falha rápido (*fail fast*) e evita exaustão de threads.
- O Single-Flight Mutex agrupa chamadas concorrentes idênticas (*request coalescing*), reduzindo a carga do banco de $N$ para $1$.

</details>

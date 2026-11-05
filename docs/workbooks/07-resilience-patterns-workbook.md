# Workbook 07: Resiliência, Escalabilidade & Padrões Distribuídos

## 🎯 Pergunta Condutora do Módulo
*Como impedir que uma lentidão em um serviço de cálculo de frete terceirizado esgote todas as conexões e threads do seu servidor e derrube o e-commerce inteiro por falha em cascata?*

---

## 🧪 Exercício 1: O Fenômeno da Falha em Cascata e o Circuit Breaker

### 1. Objetivo
Simular chamadas consecutivas a um serviço instável e observar o **Circuit Breaker** transicionar de `CLOSED` para `OPEN`, cortando chamadas lentas imediatamente em menos de 1ms (*Fast-Fail*).

### 2. Hipótese
Se um serviço externo estiver levando 5 segundos para falhar e o limite do Circuit Breaker for de 3 falhas:
- ( ) A 4ª requisição continuará esperando 5 segundos para falhar.
- ( ) A 4ª requisição falhará imediatamente em 0ms com `CircuitBreakerOpenException`, protegendo a aplicação contra acúmulo de requisições pendentes.

### 3. Faça
Execute os testes de resiliência:
```bash
npx vitest run lab/07-resilience-patterns/resilience.test.ts
```

Inspecione o Circuit Breaker em [`lab/07-resilience-patterns/circuit-breaker.ts`](../../lab/07-resilience-patterns/circuit-breaker.ts).

### 4. Observe
Veja as transições de estado:
1. `CLOSED` (Operação normal) $\to$ 3 falhas consecutivas registradas.
2. `OPEN` (Rejeição imediata sem fazer chamada de rede).
3. Após o tempo de reset $\to$ `HALF-OPEN` (Permite uma requisição canário de teste).
4. Sucesso na requisição canário $\to$ Retorna para `CLOSED`.

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**Mecânica de Estados do Circuit Breaker:**
Sem um Circuit Breaker, centenas de requisições HTTP simultâneas ficam bloqueadas aguardando timeout de conexões mortas, esgotando o pool de conexões do Node.js/Go e derrubando a CPU. O Circuit Breaker garante **Degradação Graciosa**.
</details>

---

## 🧪 Exercício 2: Prevenção de Cache Stampede / Thundering Herd com Single-Flight

### 1. Objetivo
Simular 50 requisições simultâneas requisitando a mesma chave de cache expirada ao mesmo instante e verificar que APENAS 1 requisição bate no banco de dados real.

### 2. Hipótese
Se o cache expirar e 50 threads chegarem simultaneamente:
- ( ) Todas as 50 threads executarão a query pesada no PostgreSQL simultaneamente, sobrecarregando o banco (*Cache Stampede*).
- ( ) O mecanismo de **Single-Flight** executará a query apenas uma vez e compartilhará a mesma Promise com as outras 49 chamadas, reduzindo a carga do banco em 98%.

### 3. Faça
Inspecione o Single-Flight Cache em [`lab/07-resilience-patterns/single-flight-cache.ts`](../../lab/07-resilience-patterns/single-flight-cache.ts).

### 4. Observe
O teste comprova que o contador de queries no banco executa exatamente uma única vez, resolvendo todas as 50 requisições simultâneas.

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**O Efeito Thundering Herd:**
Em sistemas de altíssimo tráfego, a simples expiração de uma chave de cache popular pode derrubar o banco de dados principal se dezenas de requisições tentarem repovoá-la ao mesmo tempo. Single-Flight garante coalescência de chamadas concorrentes.
</details>

---

## ✅ Critério de pronto

Você domina este módulo quando `npx vitest run lab/07-resilience-patterns/resilience.test.ts` passa, `npm run lint` valida sem erros e você explica, sem reabrir o gabarito, em que ponto a sua hipótese divergiu do observado em cada exercício.

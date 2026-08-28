# Guia de Referência 07: Resiliência, Escalabilidade & Padrões Distribuídos

## 1. Padrões de Resiliência Corporativa (Michael Nygard)

Em arquiteturas distribuídas de microsserviços, falhas de rede e lentidões são certezas matemáticas. O objetivo da resiliência é isolar a falha e garantir a continuidade do sistema.

### 1.1 Circuit Breaker (Disjuntor de Rede)

```mermaid
stateDiagram-v2
    [*] --> CLOSED: Operação Normal
    CLOSED --> OPEN: Falhas consecutivas > Limite
    OPEN --> HALF_OPEN: Janela de Reset Expirada
    HALF_OPEN --> CLOSED: Requisição Canário com Sucesso
    HALF_OPEN --> OPEN: Requisição Canário com Falha
```

- **CLOSED:** Requisições passam normalmente. Falhas são contabilizadas.
- **OPEN:** Todas as chamadas falham imediatamente (*Fast-Fail* sem bater na rede), evitando desperdício de threads e sockets.
- **HALF-OPEN:** Envia uma única requisição de teste para avaliar se o serviço remoto se recuperou.

### 1.2 Bulkhead (Isolamento de Recursos)
Inspirado nas anteparas dos cascos de navios: se um compartimento inundar, os outros mantêm o navio flutuando.
- Pools de threads e conexões separados por cliente/dependência.
- Se o serviço de cálculo de frete travar, o pool de checkout de cartão continua operando normalmente.

### 1.3 Retry com Exponential Backoff e Jitter
Retentar imediatamente após um erro de rede sobrecarrega o servidor que acabou de cair. A fórmula recomendada adiciona atraso exponencial e aleatoriedade (*Jitter*):
$$T_{\text{wait}} = \min(T_{\text{max}}, T_{\text{base}} \times 2^{\text{tentativa}}) + \text{random}(0, \text{Jitter})$$

---

## 2. Estratégias de Cache & Prevenção de Cache Stampede

```mermaid
graph TD
    subgraph Single_Flight_Mutex [Prevenção de Cache Stampede]
        Req1[Requisição Concorrente 1] --> Lock{Chave em Processamento?}
        Req2[Requisição Concorrente 2] --> Lock
        Req3[Requisição Concorrente 3] --> Lock
        Lock -->|Primeira Requisição| DB[(Busca Pesada no Banco)]
        DB --> Cache[(Popula Redis Cache)]
        Cache --> Share[Compartilha Resultado com Todas as 3 Requisições]
    end
```

- **Single-Flight:** Agrupa múltiplas chamadas concorrentes para a mesma chave em uma única execução de busca no banco, evitando o efeito *Thundering Herd*.

# Workbook 01: Métricas de Modularidade & Acoplamento de Martin

## 🎯 Pergunta Condutora do Módulo
*Como medir numericamente se um pacote do seu sistema está na Zona da Dor (rígido demais para mudar) ou na Zona da Inutilidade (abstração inútil sem uso), e como utilizar o Princípio de Inversão de Dependências (DIP) para reposicioná-lo na Sequência Principal?*

---

## 🧪 Exercício 1: Calculando Acoplamento Aferente ($C_a$), Eferente ($C_e$) e Instabilidade ($I$)

### 1. Objetivo
Extrair as métricas de acoplamento de um grafo de classes e calcular a estabilidade de módulos de Domínio vs Adaptadores de Infraestrutura.

### 2. Hipótese
Analise dois módulos:
- **Módulo A (Core Domain):** 5 módulos dependem dele ($C_a = 5$) e ele depende de 0 módulos externos ($C_e = 0$).
- **Módulo B (HTTP Controller):** 0 módulos dependem dele ($C_a = 0$) e ele depende de 4 serviços e DTOs ($C_e = 4$).

Formule sua previsão:
- ( ) O Módulo A possui $I = 1.0$ (máxima instabilidade) e o Módulo B possui $I = 0.0$ (máxima estabilidade).
- ( ) O Módulo A possui $I = 0.0$ (máxima estabilidade, difícil de alterar sem impactar o sistema) e o Módulo B possui $I = 1.0$ (máxima instabilidade, fácil de alterar sem causar impacto cascata).

### 3. Faça
Execute o analisador de métricas no laboratório:
```bash
npx vitest run lab/01-modularity-metrics/modularity-metrics.test.ts
```

Inspecione o analisador em [`lab/01-modularity-metrics/modularity-analyzer.ts`](../../lab/01-modularity-metrics/modularity-analyzer.ts).

### 4. Observe
Veja as métricas calculadas pelo analisador para cada pacote. Observe que o índice de instabilidade varia de $0.0$ a $1.0$.

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**A Fórmula da Instabilidade:**
$$I = \frac{C_e}{C_a + C_e}$$
- **Módulo A:** $I = \frac{0}{5 + 0} = 0.0$ (Estável).
- **Módulo B:** $I = \frac{4}{0 + 4} = 1.0$ (Instável).

**O Princípio das Dependências Estáveis (SDP):**
As dependências devem sempre fluir na direção da estabilidade:
$$I_{\text{dependência}} \le I_{\text{cliente}}$$
Controllers ($I=1.0$) podem depender de Casos de Uso ($I=0.3$), e Casos de Uso podem depender de Entidades de Domínio ($I=0.0$). O caminho inverso é uma violação arquitetural grave!
</details>

---

## 🧪 Exercício 2: Abstração ($A$) e Distância da Sequência Principal ($D$)

### 1. Objetivo
Identificar pacotes que residem na **Zona da Dor** ($I \to 0$ e $A \to 0$, ou seja, altamente estáveis porém repletos de código concreto difícil de modificar) e na **Zona da Inutilidade** ($I \to 1$ e $A \to 1$).

### 2. Hipótese
Se um módulo com 10 classes concretas e 0 interfaces tiver $C_a = 8$ e $C_e = 0$:
- ( ) Sua distância $D$ será próxima de $0.0$ (ideal).
- ( ) Sua distância $D$ será próxima de $1.0$, classificando-o diretamente na perigosa **Zona da Dor**.

### 3. Faça
Observe o teste de cálculo de distância $D = |A + I - 1|$ em [`lab/01-modularity-metrics/modularity-metrics.test.ts`](../../lab/01-modularity-metrics/modularity-metrics.test.ts).

### 4. Observe
O analisador classifica o pacote e sugere a refatoração imediata: extrair interfaces abstratas ($N_a$) para aumentar $A$, reduzindo a distância $D$ em direção à **Sequência Principal** ($A + I = 1$).

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**Princípio de Abstrações Estáveis (SAP):**
Um pacote deve ser tão abstrato quanto é estável.
Se um pacote é extremamente estável ($I \approx 0$, muitos dependem dele), ele DEVE ser composto majoritariamente de abstrações e interfaces ($A \approx 1$), permitindo que o comportamento seja estendido via polimorfismo sem necessitar de alteração no código fonte original (Open-Closed Principle).
</details>

---

## ✅ Critério de pronto

Você domina este módulo quando `npx vitest run lab/01-modularity-metrics/modularity-metrics.test.ts` passa, `npm run lint` valida sem erros e você explica, sem reabrir o gabarito, em que ponto a sua hipótese divergiu do observado em cada exercício.

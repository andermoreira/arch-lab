# Workbook 01: Métricas de Modularidade de Martin

## 🎯 Pergunta do Módulo
Como calcular matematicamente se um módulo do seu sistema está na *Zona da Dor* ou na *Sequência Principal*, e como aplicar o Princípio de Inversão de Dependências (DIP) para restaurar a estabilidade?

---

## 🧪 Exercício 1: Calculando $C_a, C_e, I, A$ e $D$

### 1. Objetivo
Analisar um grafo de dependências real e calcular o índice de Instabilidade ($I$) e Distância da Sequência Principal ($D$).

### 2. Hipótese
Formule sua previsão:
- *Se um pacote possui 4 dependentes externos ($C_a = 4$) e 0 dependências externas ($C_e = 0$), qual será seu índice de instabilidade $I$? Ele é estável ou instável?*

### 3. Faça
Execute o teste do analisador de métricas:
```bash
npx vitest run lab/01-modularity-metrics/modularity-metrics.test.ts
```

Inspecione a implementação em [`lab/01-modularity-metrics/modularity-analyzer.ts`](file:///Users/andersonalves/dev/arch-lab/lab/01-modularity-metrics/modularity-analyzer.ts).

### 4. Observe
Veja as métricas calculadas para pacotes de Domínio vs Adaptadores de Infraestrutura. Observe a classificação automática de "Main Sequence", "Zone of Pain" ou "Zone of Uselessness".

### 5. Reflexão & Gabarito
<details>
<summary>Ver explicação e gabarito</summary>

**Cálculos Formais:**
- $I = \frac{C_e}{C_a + C_e} = \frac{0}{4 + 0} = 0.0$ (Máxima Estabilidade).
- Módulos com $I = 0$ são difíceis de modificar porque muitos outros módulos dependem deles. Pelo Princípio de Abstrações Estáveis (SAP), se $I = 0$, o módulo deve ter alta abstração ($A \approx 1$) para permitir extensibilidade sem quebras.

</details>

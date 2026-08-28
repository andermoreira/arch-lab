# Guia de Referência 01: Métricas de Modularidade, Coesão & Acoplamento

## 1. As Métricas Formais de Robert C. Martin (Uncle Bob)

Ao arquitetar pacotes e módulos corporativos, a qualidade do design não deve ser uma questão de opinião subjetiva, mas sim de medição matemática determinística:

### 1.1 Acoplamento Aferente ($C_a$) e Eferente ($C_e$)
- **Acoplamento Aferente ($C_a$ - Afferent Coupling):** O número de classes fora do pacote que dependem de classes dentro do pacote. Representa a **responsabilidade** e o impacto que o pacote tem sobre o restante do sistema.
- **Acoplamento Eferente ($C_e$ - Efferent Coupling):** O número de classes fora do pacote das quais as classes dentro do pacote dependem. Representa a **vulnerabilidade** e o grau de dependência externa do pacote.

### 1.2 Instabilidade ($I$)
$$I = \frac{C_e}{C_a + C_e}$$
- Varia estritamente no intervalo $[0.0, 1.0]$.
- **$I = 0.0$ (Máxima Estabilidade):** Muitos módulos dependem dele ($C_a > 0$), e ele não depende de ninguém ($C_e = 0$). É extremamente difícil de alterar porque qualquer mudança propaga impacto em cascata.
- **$I = 1.0$ (Máxima Instabilidade):** Ninguém depende dele ($C_a = 0$), e ele depende de vários pacotes ($C_e > 0$). É muito fácil de alterar sem provocar regressões em terceiros.

### 1.3 Abstração ($A$)
$$A = \frac{N_a}{N_c}$$
- Onde $N_a$ é a quantidade de interfaces e tipos abstratos, e $N_c$ é o total de classes/tipos do pacote.
- $A = 0.0$: Pacote 100% concreto.
- $A = 1.0$: Pacote 100% abstrato (composto apenas por contratos/interfaces).

### 1.4 A Sequência Principal & Distância Normalizada ($D$)
A relação ideal entre abstração e estabilidade satisfaz a equação linear:
$$A + I = 1 \implies A = 1 - I$$

A distância euclidiana normalizada de um pacote em relação à Sequência Principal é dada por:
$$D = |A + I - 1|$$

```text
    Abstração (A)
    1.0 | [Zona da Inutilidade]     (Sequência Principal: A + I = 1)
        |       \                         /
        |         \                     /
        |           \                 /
        |             \             /
    0.0 |               \         /      [Zona da Dor]
        +----------------------------------------
       0.0                                     1.0  Instabilidade (I)
```

- **Zona da Dor ($I \approx 0, A \approx 0, D \to 1$):** Módulos altamente concretos e estáveis (muitos dependem deles). Alterá-los é traumático. Exemplo típico: Módulos de banco acoplados a regras de negócio.
- **Zona da Inutilidade ($I \approx 1, A \approx 1, D \to 1$):** Módulos repletos de interfaces abstratas das quais ninguém depende. Complexidade acidental pura.
- **Sequência Principal ($D \approx 0$):** O equilíbrio perfeito onde módulos estáveis são altamente abstratos e módulos instáveis são concretos.

---

## 2. Princípios Fundamentais de Arquitetura de Pacotes

1. **Stable Dependencies Principle (SDP):** As dependências entre componentes devem apontar sempre na direção da maior estabilidade:
   $$I_{\text{origem}} \ge I_{\text{destino}}$$
2. **Stable Abstractions Principle (SAP):** Um módulo deve ser tão abstrato quanto é estável. Módulos fundamentais de core devem ser compostos de interfaces ricas.
3. **Dependency Inversion Principle (DIP):** Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem depender de abstrações.

# Guia de Referência 01: Métricas de Modularidade & Acoplamento

## 1. As Métricas Formais de Robert C. Martin (Uncle Bob)

Ao analisar a qualidade modular de um sistema orientado a objetos ou pacotes estruturados, utilizamos as seguintes métricas fundamentais:

### 1.1 Acoplamento Aferente ($C_a$) e Eferente ($C_e$)
- **$C_a$ (Afferent Coupling):** O número de classes fora do pacote que dependem de classes dentro do pacote. Mede a **responsabilidade**.
- **$C_e$ (Efferent Coupling):** O número de classes fora do pacote das quais as classes dentro do pacote dependem. Mede a **dependência**.

### 1.2 Instabilidade ($I$)
$$I = \frac{C_e}{C_a + C_e}$$
- Varia no intervalo $[0, 1]$.
- $I = 0$: Módulo **Máximamente Estável**. É dependido por muitos e não depende de outros. Difícil de alterar sem impactar outros módulos.
- $I = 1$: Módulo **Máximamente Instável**. Não é dependido por ninguém e depende de outros. Fácil de modificar.

### 1.3 Abstração ($A$)
$$A = \frac{N_a}{N_c}$$
Onde $N_a$ é a quantidade de interfaces e classes abstratas no pacote, e $N_c$ é o total de classes/tipos.

### 1.4 A Sequência Principal & Distância Normalizada ($D$)
A relação ideal entre abstração e estabilidade satisfaz a equação:
$$A + I = 1 \implies A = 1 - I$$

A distância normalizada é calculada por:
$$D = |A + I - 1|$$

```text
    Abstração (A)
    1.0 | [Zona da Inutilidade]     (A + I = 1)
        |       \                         /
        |         \                     /
        |           \                 /
        |             \             /
    0.0 |               \         /      [Zona da Dor]
        +----------------------------------------
       0.0                                     1.0  Instabilidade (I)
```

---

## 2. Princípios de Arquitetura de Pacotes

1. **Stable Dependencies Principle (SDP):** As dependências entre módulos devem apontar sempre no sentido da maior estabilidade:
   $$I_{origem} \ge I_{destino}$$
2. **Stable Abstractions Principle (SAP):** Um módulo deve ser tão abstrato quanto é estável:
   $$\text{Se } I \to 0 \implies A \to 1$$
3. **Dependency Inversion Principle (DIP):** Módulos de alto nível de negócio não devem depender de módulos de baixo nível de infraestrutura. Ambos devem depender de abstrações (interfaces/portas).

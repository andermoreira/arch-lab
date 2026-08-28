# Workbook 03: Domain-Driven Design (DDD) Estratégico & Tático

## 🎯 Pergunta Condutora do Módulo
*Por que o anti-padrão "Modelo de Domínio Anêmico" (classes apenas com getters/setters públicos) permite que dados inválidos e dinheiro corrompido vazem para o banco, e como Value Objects e Aggregate Roots garantem invariantes transacionais inegociáveis?*

---

## 🧪 Exercício 1: O Fenômeno do Modelo Anêmico vs Value Objects Ricos

### 1. Objetivo
Tentar criar um valor monetário negativo ou com moeda inválida, e observar como um Value Object rigoroso rejeita o estado inválido no instante de sua instanciação.

### 2. Hipótese
Analise as duas abordagens:
- **Anêmica:** `order.total = -50.00; order.currency = "INVALID";`
- **DDD Rico com Value Object:** `const money = Money.create(-50, "BRL");`

Formule sua previsão:
- ( ) O método `Money.create` aceitará o valor negativo e deixará a validação para o banco de dados (coluna `CHECK`).
- ( ) O método `Money.create` lançará uma exceção de domínio imediata, garantindo que nenhum `Money` em estado inválido possa existir na memória da aplicação.

### 3. Faça
Execute a suíte de testes de DDD:
```bash
npx vitest run lab/03-domain-driven-design/ddd.test.ts
```

Inspecione os Value Objects em [`lab/03-domain-driven-design/domain/value-objects/`](file:///Users/andersonalves/dev/arch-lab/lab/03-domain-driven-design/domain/value-objects).

### 4. Observe
Veja que `Money`, `Sku` e `EmailAddress` são **imutáveis** e **auto-validados**:
- Não possuem setters.
- A igualdade é estrutural baseada em todos os seus atributos (dois `Money(100, BRL)` são estritamente iguais).

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**Por que Value Objects eliminam a "Obsessão por Primitivos" (*Primitive Obsession*)?**
Quando usamos tipos primitivos (`number`, `string`), todo método do sistema é forçado a revalidar se o número é positivo ou se a string é um e-mail válido.
Com Value Objects:
1. Se a instância existe, ela é **garantidamente válida**.
2. Operações matemáticas como `moneyA.add(moneyB)` validam moedas compatíveis e retornam uma **nova instância imutável**, eliminando efeitos colaterais.
</details>

---

## 🧪 Exercício 2: Aggregate Roots como Fronteiras de Consistência Transacional

### 1. Objetivo
Tentar violar a regra de negócio que proíbe adicionar itens duplicados ou cancelar pedidos já faturados, observando o Aggregate Root `OrderAggregate` agir como guardião único de consistência.

### 2. Hipótese
Se tentarmos modificar diretamente a lista de itens de um pedido sem passar pelo método do Aggregate Root:
- ( ) O TypeScript permitirá mutação direta via `order.items.push(...)`.
- ( ) A lista de itens é exposta como `readonly`, forçando toda mutação a passar por `order.addItem(...)`, onde as regras de negócio e cálculo de total são reavaliadas atomicamente.

### 3. Faça
Inspecione o Aggregate Root em [`lab/03-domain-driven-design/domain/aggregates/order.aggregate.ts`](file:///Users/andersonalves/dev/arch-lab/lab/03-domain-driven-design/domain/aggregates/order.aggregate.ts).

### 4. Observe
Veja que a cada mutação válida, o Aggregate Root acumula um **Domain Event** (`OrderPlacedEvent`) para ser publicado após o commit transacional.

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**Regras de Ouro dos Agregados (Vaughn Vernon):**
1. **Proteja as Invariantes de Negócio:** Nenhuma entidade interna do agregado pode ser acessada ou alterada diretamente por código externo; tudo passa pela Raiz (Root).
2. **Referencie outros Agregados apenas por Identidade (ID):** Nunca mantenha referências diretas de objetos entre agregados distintos.
3. **Um Agregado = Uma Transação de Banco:** Cada transação no banco de dados deve alterar apenas uma única instância de Aggregate Root.
</details>

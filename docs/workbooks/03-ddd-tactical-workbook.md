# Workbook 03: Domain-Driven Design (DDD) Tático

## 🎯 Pergunta do Módulo
Por que modelos anêmicos permitem que estados inválidos (ex: saldo negativo ilegal ou itens vazios em pedidos pagos) vazem para o banco, e como Agregados e Value Objects blindam as regras de negócio?

---

## 🧪 Exercício 1: Protegendo Invariantes com Aggregate Roots e VOs

### 1. Objetivo
Tentar forçar uma mutação inválida em uma entidade de domínio rica e observar a rejeição imediata da operação pelo Aggregate Root.

### 2. Hipótese
Formule sua previsão:
- *O que acontece ao tentar instanciar um `Money` com valor negativo ou tentar cancelar um `Order` que já foi entregue?*

### 3. Faça
Execute a suíte de testes do DDD:
```bash
npx vitest run lab/03-domain-driven-design/ddd.test.ts
```

Inspecione os arquivos em [`lab/03-domain-driven-design/`](file:///Users/andersonalves/dev/arch-lab/lab/03-domain-driven-design).

### 4. Observe
Verifique como o Aggregate Root `OrderAggregate` encapsula a lista de itens e valida que nenhum item com quantidade zero ou preço inválido pode ser adicionado.

### 5. Reflexão & Gabarito
<details>
<summary>Ver explicação e gabarito</summary>

**Princípios do Modelo Rico:**
- Value Objects como `Money` e `EmailAddress` validam seus dados no momento da criação (se o objeto existe, ele é garantidamente válido).
- O Aggregate Root é a única fronteira de consistência: nunca expõe coleções mutáveis diretamente (`readonly items[]`) e emite eventos de domínio como `OrderPlacedEvent`.

</details>

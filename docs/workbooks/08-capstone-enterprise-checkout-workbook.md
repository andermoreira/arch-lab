# Workbook 08: Capstone Sênior — E-Commerce Corporativo

## 🎯 Pergunta do Módulo
Como integrar múltiplos Bounded Contexts com Arquitetura Hexagonal, Sagas Orquestradas, Transactional Outbox e Fitness Functions em um sistema de Checkout Corporativo de alto padrão?

---

## 🧪 Exercício 1: Execução End-to-End do Checkout Corporativo

### 1. Objetivo
Executar a suíte de testes de integração e arquitetura do Capstone corporativo, validando o fluxo feliz e os fluxos de compensação sob falha.

### 2. Hipótese
Formule sua previsão:
- *O que acontece com o Bounded Context de Pedidos quando uma regra de negócio rejeita o pagamento e a compensação de estoque é acionada?*

### 3. Faça
Execute todos os testes do Capstone:
```bash
npx vitest run lab/08-capstone-enterprise-checkout/capstone.test.ts
```

Inspecione os arquivos em [`lab/08-capstone-enterprise-checkout/`](file:///Users/andersonalves/dev/arch-lab/lab/08-capstone-enterprise-checkout).

### 4. Observe
Veja todos os contextos colaborando via contratos de portas, os eventos sendo gravados no Outbox e os testes passando sem nenhuma violação arquitetural.

### 5. Reflexão & Gabarito
<details>
<summary>Ver explicação e gabarito</summary>

**Arquitetura Sênior de Excelência:**
- O Capstone prova que sistemas complexos corporativos podem ser modulares, altamente desacoplados, resilientes a falhas e 100% testáveis sem atalhos ou hacks.

</details>

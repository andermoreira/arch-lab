# Workbook 00: Fitness Functions & Governança Automatizada

## 🎯 Pergunta do Módulo
Como impedir que desenvolvedores importem dependências de banco de dados ou frameworks dentro das entidades de domínio sem depender de revisão manual de código?

---

## 🧪 Exercício 1: Detectando Violação de Camada no CI

### 1. Objetivo
Observar o analisador estático de Fitness Functions rejeitando código que viola a fronteira de domínio.

### 2. Hipótese
Formule sua previsão antes de rodar o teste:
- *O que deve acontecer quando um arquivo em `domain/` contiver uma importação direta de `pg` ou `express`?*

### 3. Faça
Abra o terminal e execute a suíte de testes de arquitetura:
```bash
npm run test:arch
```

Inspecione o arquivo de teste em [`lab/00-fitness-functions/fitness-functions.test.ts`](file:///Users/andersonalves/dev/arch-lab/lab/00-fitness-functions/fitness-functions.test.ts).

### 4. Observe
Analise o relatório do Vitest. Observe como a regra `assertNoInfrastructureInDomain` varre os imports dos módulos e aponta a linha exata da violação arquitetural.

### 5. Reflexão & Gabarito
<details>
<summary>Ver explicação e gabarito</summary>

**Diagnóstico Arquitetural:**
1. A camada de domínio deve ser agnóstica de tecnologia externa. Se uma entidade depender do driver `pg`, qualquer alteração no driver ou no banco contamina a regra de negócio.
2. Fitness Functions transformam regras arquiteturais subjetivas ("não importe banco no domínio") em verificações booleanas determinísticas executadas a cada commit.

</details>

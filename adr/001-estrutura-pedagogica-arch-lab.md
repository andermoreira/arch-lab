# ADR 001: Estrutura Pedagógica e Arquitetura do Repositório arch-lab

## Status
Accepted

## Data
2026-08-27

## Contexto
O aprendizado de Arquitetura de Software em nível corporativo avançado frequentemente sofre de um abismo entre teoria ("slides de caixas e setas") e a realidade da engenharia de produção ("código legado, regressões de dependência e falhas de consistência distribuída").

Precisamos de uma estrutura de repositório que garanta rigor pedagógico absoluto (100/100), aprendizado preditivo ativo e comprovação prática de cada padrão arquitetural por meio de testes automatizados e Fitness Functions.

## Decisão
Adotamos o **Tripé Pedagógico** estruturado em quatro diretórios fundamentais:

1. **`docs/journey/` (A Jornada):** Trilha linear de leitura e progressão conceitual dividida em 4 partes.
2. **`docs/workbooks/` (Workbooks Práticos):** 9 Cadernos de experimentação ativa no ciclo formal: `Objetivo → Hipótese → Faça → Observe → Reflexão/Gabarito em <details>`.
3. **`docs/reference/` (Referência Técnica & C4):** Catálogo profundo com diagramas C4 em Mermaid, métricas matemáticas e análise detalhada de trade-offs.
4. **`lab/` (Código Real e Executável):** Laboratórios em TypeScript/Node.js com testes unitários, testes de concorrência e Fitness Functions executáveis via `npm test` e Docker.

Adicionalmente, estabelecemos que:
- O fenômeno e a falha de código devem ser observados antes da formalização teórica.
- O repositório utilizará Node.js 22+ com TypeScript estrito, Vitest, PostgreSQL 16 e Redis 7.

## Consequências

### Positivas
- Eliminação total de hand-waving: todo conceito possui código real que falha e passa.
- O aluno constrói modelos mentais permanentes formulando hipóteses antes de ver gabaritos.
- Arquitetura viva com governança testável via Fitness Functions.

### Negativas / Mitigações
- Exige esforço contínuo de manutenção para garantir que todos os 9 labs permaneçam executáveis e compiláveis (mitigado por automação no Makefile e Docker Compose).

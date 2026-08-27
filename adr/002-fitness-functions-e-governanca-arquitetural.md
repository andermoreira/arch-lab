# ADR 002: Fitness Functions e Governança Arquitetural Contínua

## Status
Accepted

## Data
2026-08-27

## Contexto
Em projetos corporativos de grande porte com equipes distribuídas, as diretrizes de arquitetura definidas em documentos ou reuniões de design invariavelmente sofrem erosão (*architectural drift*). Desenvolvedores sob pressão de prazos inadvertidamente importam bibliotecas de banco de dados diretamente dentro de entidades de domínio ou controllers, quebrando o isolamento de camadas.

Revisões manuais de código (Code Reviews) são falíveis e dependem de disciplina humana.

## Decisão
Implementamos **Fitness Functions automatizadas** como testes de primeira classe executados no pipeline de CI (`npm run test:arch`).

As Fitness Functions do `arch-lab`:
1. Analisam estaticamente o grafo de importações dos módulos.
2. Garantem que o pacote de Domínio (`domain/`) não importe nada de `infrastructure/`, `adapters/` ou frameworks externos.
3. Garantem que a camada de Aplicação (`application/`) dependa apenas de portas (`ports/`) e do Domínio, nunca de adaptadores concretos.
4. Detectam e bloqueiam ciclos de dependência entre pacotes.

## Consequências

### Positivas
- Governança arquitetural determinística e automática: se uma dependência proibida for adicionada, a suíte de testes falha imediatamente no CI.
- Redução de débito técnico e preservação da testabilidade pura das regras de negócio.

### Negativas / Mitigações
- Custo computacional na execução de testes estáticos (mitigado por analisadores leves baseados em grafos de importação em memória).

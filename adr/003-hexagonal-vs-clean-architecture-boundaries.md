# ADR 003: Fronteiras de Domínio com Arquitetura Hexagonal (Ports & Adapters)

## Status
Accepted

## Data
2026-08-27

## Contexto
O padrão tradicional em camadas N-Tier com dependência descendente direta (`Controller -> Service -> Repository/ORM`) acopla a modelagem de domínio às tabelas relacionais e aos detalhes de infraestrutura (Database-Driven Design). Como resultado, alterações no banco ou a troca de fornecedores de API externa forçam modificações diretas nas regras de negócio.

## Decisão
Adotamos a **Arquitetura Hexagonal (Ports & Adapters)** combinada com a **Regra da Dependência da Clean Architecture**:
1. O **Core de Domínio** contém entidades, agregados e regras de negócio puras, com zero dependências de I/O externo.
2. **Driving Ports (Inbound):** Casos de uso implementados como interfaces que definem o que a aplicação faz.
3. **Driven Ports (Outbound):** Interfaces de repositórios e gateways declaradas dentro do núcleo da aplicação para o que o domínio precisa consumir.
4. **Adaptadores:** Ficam na camada externa de infraestrutura e implementam ou consomem as portas via Inversão de Dependência (DIP).

## Consequências

### Positivas
- Domínio 100% testável em memória sem necessidade de mocks complexos de banco ou servidores HTTP.
- Facilidade de substituição de tecnologia (ex: trocar Postgres por DynamoDB ou Redis sem alterar regras de negócio).

### Negativas / Mitigações
- Aumento no número de arquivos e interfaces (*indirection overhead*). Justificado pela longevidade e isolamento de regras críticas.

# GLOSSÁRIO & MODELOS MENTAIS — arch-lab

Este glossário define com rigor os termos fundamentais, métricas matemáticas, teoremas distribuídos e modelos mentais de Arquitetura de Software e Engenharia de Sistemas Corporativos.

---

## 1. Fundamentos Arquiteturais & Métricas

- **Arquitetura de Software:** O conjunto de decisões de design estrutural que moldam um sistema, com alto custo de modificação posterior e impacto direto nos Atributos de Qualidade (NFRs).
- **Atributos de Qualidade (NFRs):** Características operacionais e estruturais do sistema (ex: Latência, Throughput, Disponibilidade, Tolerância a Falhas, Modificabilidade, Testabilidade, Segurança).
- **Fitness Function:** Qualquer mecanismo (teste automatizado, linter de AST, monitoramento em tempo real) que fornece uma avaliação objetiva e contínua da integridade de uma característica arquitetural.
- **Acoplamento Aferente ($C_a$):** Número de classes/módulos externos que dependem das classes de um pacote (indica a responsabilidade do pacote).
- **Acoplamento Eferente ($C_e$):** Número de classes/módulos externos de que as classes de um pacote dependem (indica a dependência do pacote).
- **Instabilidade ($I$):** Razão calculada como $I = \frac{C_e}{C_a + C_e}$. Varia de $0$ (máxima estabilidade, difícil de mudar pois muitos dependem dele) a $1$ (máxima instabilidade, fácil de mudar pois ninguém depende dele).
- **Abstração ($A$):** Razão calculada como $A = \frac{N_a}{N_c}$, onde $N_a$ é o número de interfaces/classes abstratas e $N_c$ é o total de classes no pacote. Varia de $0$ (totalmente concreto) a $1$ (totalmente abstrato).
- **Distância da Sequência Principal ($D$):** Distância normalizada da linha ideal $A + I = 1$, calculada como $D = |A + I - 1|$. Módulos próximos de $D = 0$ são perfeitamente balanceados. Módulos com $A \approx 0$ e $I \approx 0$ caem na *Zona da Dor* (difíceis de mudar e concretos). Módulos com $A \approx 1$ e $I \approx 1$ caem na *Zona da Inutilidade* (abstrações sem dependentes).
- **Stable Dependencies Principle (SDP):** As dependências de um módulo devem apontar sempre na direção da maior estabilidade ($I_{dependente} \ge I_{dependência}$).
- **Stable Abstractions Principle (SAP):** Um módulo deve ser tão abstrato quanto é estável ($A \approx 1 - I$).

---

## 2. Padrões de Fronteira & Clean Architecture

- **Arquitetura Hexagonal (Ports & Adapters):** Estilo arquitetural formulado por Alistair Cockburn que isola a lógica de negócio central de qualquer dependência externa através de *Portas* e *Adaptadores*.
- **Driving Port (Inbound / Primária):** Interface que define os casos de uso expostos pelo domínio para serem acionados por agentes externos (ex: HTTP Controller, CLI, Consumer de Mensageria).
- **Driven Port (Outbound / Secundária):** Interface definida pelo domínio que descreve os serviços externos de que o domínio necessita (ex: Repositórios de dados, Gateways de pagamento, Provedores de e-mail).
- **Adaptador (Adapter):** Implementação concreta de uma porta ou acionador dela (ex: `PostgresOrderRepository`, `StripePaymentGateway`, `ExpressHttpController`).
- **Clean Architecture:** Arquitetura proposta por Robert C. Martin baseada na *Regra da Dependência*: o código-fonte deve sempre apontar para dentro, em direção aos Casos de Uso e Entidades de Domínio. Nenhuma referência a banco, UI ou frameworks pode existir nas camadas internas.

---

## 3. Domain-Driven Design (DDD)

- **Linguagem Ubíqua (Ubiquitous Language):** Vocabulário rigoroso compartilhado entre especialistas de domínio e desenvolvedores, refletido diretamente no código.
- **Bounded Context:** Limite semântico e conceitual explícito dentro do qual um modelo de domínio específico é aplicável e consistente.
- **Context Mapping:** Mapeamento formal das relações entre múltiplos Bounded Contexts (ex: *Shared Kernel*, *Customer-Supplier*, *Conformist*, *Anti-Corruption Layer*).
- **Anti-Corruption Layer (ACL):** Camada de tradução e isolamento que converte contratos e modelos de um sistema legado/externo para o modelo puro do domínio interno, impedindo que o modelo externo contamine o core.
- **Entity:** Objeto de domínio definido por uma identidade contínua única e mutabilidade controlada ao longo do tempo (ex: `Order` com `id = 123`).
- **Value Object (VO):** Objeto de domínio imutável sem identidade própria, definido inteiramente pela igualdade de seus atributos (ex: `Money(amount=100, currency="BRL")`).
- **Aggregate & Aggregate Root:** Agrupamento de entidades e objetos de valor tratados como uma unidade atômica transacional. Todo acesso externo ao agregado deve passar obrigatoriamente pela sua raiz (*Aggregate Root*), que garante todas as invariantes de negócio.
- **Invariante de Domínio:** Regra de negócio estrita que deve permanecer verdadeira em todos os momentos durante a execução de uma transação.
- **Domain Event:** Fato imutável de relevância de negócio que ocorreu no passado dentro do domínio (ex: `OrderPlaced`, `PaymentDeclined`).

---

## 4. Persistência, CQRS & Event Sourcing

- **CQRS (Command Query Responsibility Segregation):** Padrão que separa explicitamente os modelos de mutação de dados (*Commands*, focados em validação de invariantes e consistência) dos modelos de leitura (*Queries*, focados em consultas rápidas e projeções desnormalizadas).
- **Event Sourcing:** Padrão arquitetural onde o estado de uma entidade não é armazenado como snapshot mutável atualizado no banco, mas sim reconstruído sob demanda a partir da sequência cronológica imutável de todos os eventos já ocorridos (*Append-Only Event Store*).
- **Projection (Projeção / Read Model):** Visão de leitura otimizada construída e atualizada assincronamente através do consumo de eventos de domínio emitidos pelo Event Store.
- **Event Replay:** Processo de reprocessar o histórico completo de eventos de um stream para reconstruir o estado de agregados ou recriar projeções do zero.
- **Optimistic Concurrency Control:** Técnica onde cada evento possui um número de versão sequencial no aggregate stream. Ao persistir novos eventos, o motor rejeita gravações se a versão esperada (`expectedVersion`) não corresponder à versão atual do banco.

---

## 5. Arquitetura Orientada a Eventos & Resiliência Distribuída

- **Dual-Write Problem:** Anti-padrão onde uma aplicação tenta gravar dados em uma base de dados relacional e enviar uma mensagem para um broker em duas operações de rede separadas. Falhas na segunda chamada geram inconsistência irrecuperável.
- **Transactional Outbox Pattern:** Padrão que soluciona o Dual-Write salvando o evento de saída em uma tabela `outbox` dentro da mesma transação ACID do banco de dados relacional. Um processo em background (*Relay* ou *CDC*) lê e publica as mensagens no broker de forma garantida.
- **Idempotent Consumer:** Receptor de mensagens que rastreia identificadores únicos de mensagens processadas (`processed_messages`), garantindo que a entrega duplicada de mensagens (*At-Least-Once*) resulte exatamente no mesmo estado final sem efeitos colaterais.
- **Teorema CAP:** Em um sistema distribuído sujeito a partições de rede ($P$), é matematicamente impossível garantir simultaneamente Consistência Forte ($C$) e Disponibilidade ($A$).
- **Teorema PACELC:** Extensão do CAP que afirma: se houver partição ($P$), deve-se escolher entre Disponibilidade ($A$) ou Consistência ($C$); senão ($E$), sob operação normal, deve-se escolher entre Latência ($L$) ou Consistência ($C$).
- **Padrão Saga:** Padrão para gerenciar transações de longa duração e distribuídas entre múltiplos microsserviços sem utilizar bloqueios de 2PC (Two-Phase Commit).
- **Transação Compensatória (Compensating Transaction):** Operação de desfazimento semântico que reverte os efeitos de uma transação local anterior caso uma etapa futura da Saga falhe.
- **Circuit Breaker:** Mecanismo de proteção que monitora chamadas a serviços externos. Ao detectar falhas consecutivas acima de um limiar, abre o circuito (`OPEN`) e rejeita chamadas imediatamente sem onerar o serviço degradado, testando periodicamente a recuperação (`HALF_OPEN`) antes de normalizar (`CLOSED`).
- **Bulkhead:** Isolamento de recursos computacionais (pools de conexões, workers, memórias) para garantir que a lentidão de uma dependência não esgote os recursos do sistema como um todo.
- **Cache Stampede / Thundering Herd:** Fenômeno catastrófico que ocorre quando uma chave de cache muito requisitada expira simultaneamente, fazendo centenas de requisições concorrentes baterem ao mesmo tempo no banco de dados. Resolvido com Mutex Single-Flight ou revalidação probabilística.

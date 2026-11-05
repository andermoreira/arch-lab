# GLOSSÁRIO & MODELOS MENTAIS — arch-lab

Este glossário define com rigor os termos fundamentais, métricas matemáticas, teoremas distribuídos e modelos mentais de Arquitetura de Software e Engenharia de Sistemas Corporativos.

---

## 1. Fundamentos Arquiteturais & Métricas

- **Arquitetura de Software:** O conjunto de decisões de design estrutural que moldam um sistema, com alto custo de modificação posterior e impacto direto nos Atributos de Qualidade (NFRs).
  > **Analogia:** A fundação e os pilares de sustentação de um prédio de 30 andares: você pode pintar as paredes e trocar os móveis a qualquer hora, mas não pode mover os pilares centrais sem risco de desabamento.
- **Atributos de Qualidade (NFRs):** Características operacionais e estruturais do sistema (ex: Latência, Throughput, Disponibilidade, Tolerância a Falhas, Modificabilidade, Testabilidade, Segurança).
  > **Analogia:** As especificações de segurança e conforto de um carro: consumo de combustível, freios ABS e nota em testes de colisão, em contraste com a cor do estofamento.
- **Fitness Function:** Qualquer mecanismo (teste automatizado, linter de AST, monitoramento em tempo real) que fornece uma avaliação objetiva e contínua da integridade de uma característica arquitetural.
  > **Analogia:** O fiscal da vigilância sanitária ou do corpo de bombeiros que afere as normas de segurança da obra com trena e instrumentos calibrados a cada semana.
- **Acoplamento Aferente ($C_a$):** Número de classes/módulos externos que dependem das classes de um pacote (indica a responsabilidade do pacote).
- **Acoplamento Eferente ($C_e$):** Número de classes/módulos externos de que as classes de um pacote dependem (indica a dependência do pacote).
- **Instabilidade ($I$):** Razão calculada como $I = \frac{C_e}{C_a + C_e}$. Varia de $0$ (máxima estabilidade, difícil de mudar pois muitos dependem dele) a $1$ (máxima instabilidade, fácil de mudar pois ninguém depende dele).
  > **Analogia:** Uma rocha de alicerce ($I=0$) suporta o peso da casa e não pode se mexer; uma folha de papel na mesa ($I=1$) voa com facilidade sem derrubar nada ao redor.
- **Abstração ($A$):** Razão calculada como $A = \frac{N_a}{N_c}$, onde $N_a$ é o número de interfaces/classes abstratas e $N_c$ é o total de classes no pacote. Varia de $0$ (totalmente concreto) a $1$ (totalmente abstrato).
- **Distância da Sequência Principal ($D$):** Distância normalizada da linha ideal $A + I = 1$, calculada como $D = |A + I - 1|$. Módulos próximos de $D = 0$ são perfeitamente balanceados. Módulos com $A \approx 0$ e $I \approx 0$ caem na *Zona da Dor* (difíceis de mudar e concretos). Módulos com $A \approx 1$ e $I \approx 1$ caem na *Zona da Inutilidade* (abstrações sem dependentes).
- **Stable Dependencies Principle (SDP):** As dependências de um módulo devem apontar sempre na direção da maior estabilidade ($I_{dependente} \ge I_{dependência}$).
- **Stable Abstractions Principle (SAP):** Um módulo deve ser tão abstrato quanto é estável ($A \approx 1 - I$).

---

## 2. Padrões de Fronteira & Clean Architecture

- **Arquitetura Hexagonal (Ports & Adapters):** Estilo arquitetural formulado por Alistair Cockburn que isola a lógica de negócio central de qualquer dependência externa através de *Portas* e *Adaptadores*.
  > **Analogia:** A tomada de parede e o plugue de 3 pinos: o eletrodoméstico (adaptador) conecta na tomada padrão (porta) sem que você precise abrir o conduíte da parede para soldar fios.
- **Driving Port (Inbound / Primária):** Interface que define os casos de uso expostos pelo domínio para serem acionados por agentes externos (ex: HTTP Controller, CLI, Consumer de Mensageria).
- **Driven Port (Outbound / Secundária):** Interface definida pelo domínio que descreve os serviços externos de que o domínio necessita (ex: Repositórios de dados, Gateways de pagamento, Provedores de e-mail).
- **Adaptador (Adapter):** Implementação concreta de uma porta ou acionador dela (ex: `PostgresOrderRepository`, `StripePaymentGateway`, `ExpressHttpController`).
- **Clean Architecture:** Arquitetura proposta por Robert C. Martin baseada na *Regra da Dependência*: o código-fonte deve sempre apontar para dentro, em direção aos Casos de Uso e Entidades de Domínio. Nenhuma referência a banco, UI ou frameworks pode existir nas camadas internas.
  > **Analogia:** Uma sala cirúrgica hospitalar esterilizada: as bactérias e poeira da rua (bancos, frameworks, UI) ficam barradas na ante-sala pelos equipamentos de proteção.

---

## 3. Domain-Driven Design (DDD)

- **Linguagem Ubíqua (Ubiquitous Language):** Vocabulário rigoroso compartilhado entre especialistas de domínio e desenvolvedores, refletido diretamente no código.
  > **Analogia:** Um dicionário oficial bilíngue aprovado pelo médico e pelo engenheiro de software para garantir que "estorno" signifique a mesma operação para os dois.
- **Bounded Context:** Limite semântico e conceitual explícito dentro do qual um modelo de domínio específico é aplicável e consistente.
  > **Analogia:** A palavra "passagem": no guichê do aeroporto significa bilhete com assento marcado; no departamento de engenharia rodoviária significa viaduto elevado. Cada contexto tem sua própria definição.
- **Context Mapping:** Mapeamento formal das relações entre múltiplos Bounded Contexts (ex: *Shared Kernel*, *Customer-Supplier*, *Conformist*, *Anti-Corruption Layer*).
- **Anti-Corruption Layer (ACL):** Camada de tradução e isolamento que converte contratos e modelos de um sistema legado/externo para o modelo puro do domínio interno, impedindo que o modelo externo contamine o core.
  > **Analogia:** Um diplomata ou tradutor juramentado que escuta um documento em dialeto arcaico e traduz em português formal e polido antes de entregar ao presidente.
- **Entity:** Objeto de domínio definido por uma identidade contínua única e mutabilidade controlada ao longo do tempo (ex: `Order` com `id = 123`).
- **Value Object (VO):** Objeto de domínio imutável sem identidade própria, definido inteiramente pela igualdade de seus atributos (ex: `Money(amount=100, currency="BRL")`).
  > **Analogia:** Duas cédulas de R$ 50 reais limpas têm exatamente o mesmo valor; você não se importa com o número de série da cédula no caixa do supermercado.
- **Aggregate & Aggregate Root:** Agrupamento de entidades e objetos de valor tratados como uma unidade atômica transacional. Todo acesso externo ao agregado deve passar obrigatoriamente pela sua raiz (*Aggregate Root*), que garante todas as invariantes de negócio.
  > **Analogia:** Um pacote fechado de entregas com lacre de segurança: você fala com o entregador e recebe o pacote inteiro, sem que ninguém abra a caixa na rua para tirar uma peça.
- **Invariante de Domínio:** Regra de negócio estrita que deve permanecer verdadeira em todos os momentos durante a execução de uma transação.
- **Domain Event:** Fato imutável de relevância de negócio que ocorreu no passado dentro do domínio (ex: `OrderPlaced`, `PaymentDeclined`).

---

## 4. Persistência, CQRS & Event Sourcing

- **CQRS (Command Query Responsibility Segregation):** Padrão que separa explicitamente os modelos de mutação de dados (*Commands*, focados em validação de invariantes e consistência) dos modelos de leitura (*Queries*, focados em consultas rápidas e projeções desnormalizadas).
  > **Analogia:** O balcão de compras de uma livraria (onde se processam pagamentos e conferem estoque) versus a vitrine e catálogo impresso (onde os clientes apenas folheiam sem travar o caixa).
- **Event Sourcing:** Padrão arquitetural onde o estado de uma entidade não é armazenado como snapshot mutável atualizado no banco, mas sim reconstruído sob demanda a partir da sequência cronológica imutável de todos os eventos já ocorridos (*Append-Only Event Store*).
  > **Analogia:** O livro-razão de um contador ou o extrato de banco: ninguém apaga as linhas passadas; cada transação nova é registrada na linha de baixo e o saldo é o resultado do cálculo de todas as linhas.
- **Projection (Projeção / Read Model):** Visão de leitura otimizada construída e atualizada assincronamente através do consumo de eventos de domínio emitidos pelo Event Store.
  > **Analogia:** Um painel de placar eletrônico no estádio: ele consome os apitos do árbitro (gols, faltas) e mostra o placar consolidado para a torcida em tempo real.
- **Event Replay:** Processo de reprocessar o histórico completo de eventos de um stream para reconstruir o estado de agregados ou recriar projeções do zero.
- **Optimistic Concurrency Control:** Técnica onde cada evento possui um número de versão sequencial no aggregate stream. Ao persistir novos eventos, o motor rejeita gravações se a versão esperada (`expectedVersion`) não corresponder à versão atual do banco.

---

## 5. Arquitetura Orientada a Eventos & Resiliência Distribuída

- **Dual-Write Problem:** Anti-padrão onde uma aplicação tenta gravar dados em uma base de dados relacional e enviar uma mensagem para um broker em duas operações de rede separadas. Falhas na segunda chamada geram inconsistência irrecuperável.
  > **Analogia:** Pagar a conta na lotérica e depois torcer para não perder o comprovante no caminho até o escritório.
- **Transactional Outbox Pattern:** Padrão que soluciona o Dual-Write salvando o evento de saída em uma tabela `outbox` dentro da mesma transação ACID do banco de dados relacional. Um processo em background (*Relay* ou *CDC*) lê e publica as mensagens no broker de forma garantida.
  > **Analogia:** Deixar a carta dentro da caixa postal na porta da sua própria casa durante o almoço. O carteiro oficial recolhe e entrega sem que você precise sair na chuva.
- **Idempotent Consumer:** Receptor de mensagens que rastreia identificadores únicos de mensagens processadas (`processed_messages`), garantindo que a entrega duplicada de mensagens (*At-Least-Once*) resulte exatamente no mesmo estado final sem efeitos colaterais.
  > **Analogia:** Uma catraca de estádio que registra o código de barras de cada ingresso: se você passar o mesmo ingresso duas vezes, a catraca não cobra duas vezes e não deixa duas pessoas entrarem.
- **Teorema CAP:** Em um sistema distribuído sujeito a partições de rede ($P$), é matematicamente impossível garantir simultaneamente Consistência Forte ($C$) e Disponibilidade ($A$).
  > **Analogia:** Se o telefone entre duas filiais da mesma loja quebrar (partição), você deve escolher: ou para de vender nas duas para ninguém vender o mesmo produto duplicado (Consistência), ou continua vendendo nas duas correndo o risco de ter vendido duas vezes o mesmo item (Disponibilidade).
- **Teorema PACELC:** Extensão do CAP que afirma: se houver partição ($P$), deve-se escolher entre Disponibilidade ($A$) ou Consistência ($C$); senão ($E$), sob operação normal, deve-se escolher entre Latência ($L$) ou Consistência ($C$).
- **Padrão Saga:** Padrão para gerenciar transações de longa duração e distribuídas entre múltiplos microsserviços sem utilizar bloqueios de 2PC (Two-Phase Commit).
  > **Analogia:** Um agente de viagens que reserva voo, hotel e aluguel de carro sequencialmente. Se o carro não estiver disponível, ele aciona o cancelamento do hotel e da passagem aérea.
- **Transação Compensatória (Compensating Transaction):** Operação de desfazimento semântico que reverte os efeitos de uma transação local anterior caso uma etapa futura da Saga falhe.
- **Circuit Breaker:** Mecanismo de proteção que monitora chamadas a serviços externos. Ao detectar falhas consecutivas acima de um limiar, abre o circuito (`OPEN`) e rejeita chamadas imediatamente sem onerar o serviço degradado, testando periodicamente a recuperação (`HALF_OPEN`) antes de normalizar (`CLOSED`).
  > **Analogia:** O disjuntor da rede elétrica que desarma quando há curto-circuito, impedindo que a casa inteira pegue fogo.
- **Bulkhead:** Isolamento de recursos computacionais (pools de conexões, workers, memórias) para garantir que a lentidão de uma dependência não esgote os recursos do sistema como um todo.
  > **Analogia:** Os compartimentos estanques de um navio: se um bater na pedra, as comportas fecham e apenas uma câmara inunda, mantendo o barco flutuando.
- **Cache Stampede / Thundering Herd:** Fenômeno catastrófico que ocorre quando uma chave de cache muito requisitada expira simultaneamente, fazendo centenas de requisições concorrentes baterem ao mesmo tempo no banco de dados. Resolvido com Mutex Single-Flight ou revalidação probabilística.
  > **Analogia:** Mil pessoas tentando passar ao mesmo tempo pela mesma porta estreita no instante em que o sinal abre; com fila única (single-flight), apenas uma pessoa passa e traz a informação para o grupo.

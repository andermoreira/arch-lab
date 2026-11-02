# 🧭 Guia para Iniciantes — Como Pensar como um Arquiteto de Software

Se você nunca estudou arquitetura de software, Hexagonal Architecture, Domain-Driven Design (DDD), CQRS ou sistemas distribuídos, **este guia é para você**.

Aqui desmistificamos o jargão com **analogias do mundo real**, mostramos por que sistemas simples viram monstros incontroláveis e como você pode rodar seu primeiro teste arquitetural em menos de 5 minutos!

---

## 1. O Que É Arquitetura de Software? (Analogia do Edifício)

Imagine que você vai construir uma casa de cachorro de madeira no quintal:
- Se errar o tamanho da porta, você puxa o serrote, corta um pedaço maior em 5 minutos e está resolvido.
- Você não precisa de planta baixa, engenheiro civil ou cálculo estrutural.

Agora imagine construir um **edifício residencial de 30 andares com garagem subterrânea**:
- Se depois que o 20º andar estiver pronto você descobrir que os pilares da garagem não aguentam a carga, você **não pode simplesmente passar uma serra nos pilares**. Mudar a fundação pode derrubar o prédio inteiro!

> 💡 **Arquitetura de software** são aquelas decisões que você gostaria de acertar logo no começo porque **mudá-las depois custa milhões de reais ou meses de refatoração**.
> Exemplos: como as partes do sistema se comunicam, quem pode depender de quem, como lidamos com falhas e onde mora a verdade dos dados.

---

## 2. Analogias do Mundo Real para os Grandes Conceitos

### 🧱 Acoplamento & Coesão (As Tomadas de Parede)
- **Alto Acoplamento (Ruim):** Soldar o cabo da sua televisão diretamente nos fios de cobre desencapados dentro da parede da sala. Se a TV queimar ou você mudar de sofá, tem que quebrar a parede de alvenaria.
- **Baixo Acoplamento / Portas & Adaptadores (Bom):** A tomada padrão de 3 pinos (a *Porta*). A tomada não sabe se você vai ligar uma TV, um ventilador ou uma torradeira. Cada aparelho traz o seu plugue (o *Adaptador*). Se a TV pifar, você simplesmente puxa o plugue e coloca outra no lugar sem tocar na fiação da casa.

### 🛡️ Fitness Functions (O Fiscal da Obra e a Trena)
Em construções civis, existe o fiscal do corpo de bombeiros que chega com a trena e afere: *"A porta de emergência precisa ter no mínimo 1,20m de largura e abrir para fora"*. Se tiver 1,19m, a obra é embargada imediatamente.
- No código, uma **Fitness Function** é um teste automatizado que confere a fiação: se um programador importar uma biblioteca de banco de dados (`import { Pool } from 'pg'`) dentro da regra de negócio central, o teste no CI falha imediatamente antes do deploy!

### 🧅 Clean & Hexagonal Architecture (A Sala de Cirurgia Esterilizada)
- Imagine a **lógica de negócio** (regras do seu produto) como o paciente em uma mesa de cirurgia estéril.
- O banco de dados Postgres, as rotas HTTP do Express e os e-mails da AWS são como as roupas de rua dos médicos e acompanhantes.
- Ninguém entra na sala de cirurgia com sapatos de barro da rua! Os médicos trocam de roupa, lavam as mãos e usam máscaras e luvas descartáveis (os *Adaptadores*). O paciente (Domínio) nunca precisa saber se lá fora está chovendo ou fazendo sol.

### 📦 DDD — Aggregates & Invariantes (O Pacote Fechado dos Correios)
Imagine que você compre um kit com um celular, o fone de ouvido e a bateria.
- A loja não deixa uma pessoa na esteira pegar a bateria avulsa e sair correndo sem atualizar o pedido: o kit é uma **unidade atômica** (o *Aggregate*).
- O pedido inteiro tem uma **regra inquebrável** (a *Invariante*): *"O total do pedido deve ser exatamente a soma dos itens + frete"*.
- Você só pode falar com o atendente principal (a *Aggregate Root*); ninguém mexe nas tripas dos itens por fora.

### 📬 Transactional Outbox (A Carta na Caixa de Correio da Própria Casa)
Você precisa pagar uma conta no banco e enviar uma carta para um amigo.
- **O Erro do Dual-Write:** Pagar a conta pelo app e depois sair a pé até a agência dos Correios para postar a carta. Se no caminho começar uma tempestade e cair a energia, você pagou a conta mas a carta nunca foi enviada (inconsistência!).
- **A Solução Outbox:** Colocar a carta dentro de uma caixinha de correio na porta da sua própria casa durante o pagamento da conta. Um carteiro que passa de tempos em tempos recolhe as cartas da caixinha e garante a entrega. Se faltar luz, a carta ainda estará lá esperando o próximo carteiro.

### ✈️ Padrão Saga (Comprar Passagem + Hotel + Aluguel de Carro)
Não existe um "botão mágico mundial" que reserve ao mesmo tempo seu voo na Gol, seu quarto no Ibis e o carro na Localiza em uma única transação de banco.
- Primeiro reserva o voo (Passo 1).
- Depois tenta reservar o hotel (Passo 2).
- Se o hotel estiver lotado e a operação falhar, o sistema aciona a **Transação Compensatória**: cancela a reserva do voo e devolve seu dinheiro no cartão!

---

## 3. Seu Primeiro Experimento em 5 Minutos 🚀

Vamos ver uma **Fitness Function** e as **Métricas de Acoplamento** rodando de verdade!

### Passo 1: Abra o terminal na raiz do lab
```bash
cd /Users/andersonalves/dev/_labs/arch-lab
```

### Passo 2: Execute os testes das Fases 0 e 1
```bash
npm test lab/00-fitness-functions/fitness-functions.test.ts lab/01-modularity-metrics/modularity-metrics.test.ts
```

Você verá algo como:
```text
 ✓ lab/00-fitness-functions/fitness-functions.test.ts (6 tests)
 ✓ lab/01-modularity-metrics/modularity-metrics.test.ts (6 tests)

 Test Files  2 passed (2)
      Tests  12 passed (12)
```

### O que acabou de acontecer?
1. O teste de **Fitness Function** leu os arquivos de código-fonte em TypeScript como texto, analisou a árvore sintática (AST) e garantiu que nenhuma camada de Domínio importa coisas de infraestrutura.
2. O teste de **Métricas de Robert Martin** calculou matematicamente o grau de Instabilidade ($I$) e Abstração ($A$) dos módulos e verificou se eles estão distantes da "Zona da Dor" (código rígido e difícil de mudar).

---

## 4. Roteiro Recomendado de Estudos

Para aproveitar o máximo sem se sobrecarregar:

1. **Leia a Jornada Passo a Passo:** Comece por [`docs/journey/README.md`](journey/README.md).
2. **Consulte o Glossário:** Sempre que encontrar um termo como *Aggregate*, *Idempotência*, *CAP* ou *Saga*, consulte [`docs/GLOSSARIO.md`](GLOSSARIO.md) para ver a analogia correspondente.
3. **Preencha os Workbooks:** Em cada fase em `docs/workbooks/`, tente prever a saída mentalmente (*Hipótese*) antes de rodar o comando!

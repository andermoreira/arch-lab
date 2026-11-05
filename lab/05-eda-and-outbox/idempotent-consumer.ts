import type { BrokerMessage } from './message-broker.js';

/**
 * Armazenamento de IDs já processados.
 *
 * O ponto pedagógico: idempotência real NÃO é "checar um Set em memória". O id
 * da mensagem processada precisa ser persistido na MESMA transação do efeito
 * colateral do negócio. Se o consumidor cair (crash) logo após aplicar o efeito
 * mas antes de registrar o id, na redistribuição (at-least-once) o efeito seria
 * aplicado de novo. Por isso o store é injetável: em produção ele seria uma
 * tabela `processed_messages` no mesmo banco/transação do efeito.
 */
export interface ProcessedMessageStore {
  has(messageId: string): boolean;
  add(messageId: string): void;
}

/** Implementação in-memory (default). Representa a tabela processed_messages. */
export class InMemoryProcessedMessageStore implements ProcessedMessageStore {
  private readonly ids = new Set<string>();

  public has(messageId: string): boolean {
    return this.ids.has(messageId);
  }

  public add(messageId: string): void {
    this.ids.add(messageId);
  }
}

export class IdempotentConsumer {
  public processedCount: number = 0;
  public skippedDuplicatesCount: number = 0;

  /**
   * O store é injetado. Passar o MESMO store para um novo IdempotentConsumer
   * simula o consumidor reiniciando após um crash: como a marca de processamento
   * está persistida fora do processo, o efeito não é reaplicado.
   */
  constructor(
    private readonly store: ProcessedMessageStore = new InMemoryProcessedMessageStore()
  ) {}

  public async handleMessage(message: BrokerMessage): Promise<void> {
    // 1. Idempotency Check (consulta o store persistido).
    if (this.store.has(message.messageId)) {
      this.skippedDuplicatesCount += 1;
      return; // Skip side effects
    }

    // 2. Efeito colateral do negócio + 3. marca o id processado.
    // Numa implementação real (2) e (3) ocorreriam na mesma transação de banco.
    this.processedCount += 1;
    this.store.add(message.messageId);
  }
}

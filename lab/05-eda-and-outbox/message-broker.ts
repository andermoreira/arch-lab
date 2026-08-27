export interface BrokerMessage {
  messageId: string;
  topic: string;
  payload: Record<string, unknown>;
  publishedAt: Date;
}

export class MockMessageBroker {
  public isHealthy: boolean = true;
  private readonly subscribers = new Map<string, Array<(msg: BrokerMessage) => Promise<void>>>();
  public readonly publishedMessages: BrokerMessage[] = [];

  public subscribe(topic: string, handler: (msg: BrokerMessage) => Promise<void>): void {
    const handlers = this.subscribers.get(topic) || [];
    handlers.push(handler);
    this.subscribers.set(topic, handlers);
  }

  public async publish(topic: string, messageId: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.isHealthy) {
      throw new Error('Message Broker Connection Timeout (Network partition)');
    }

    const message: BrokerMessage = {
      messageId,
      topic,
      payload,
      publishedAt: new Date(),
    };

    this.publishedMessages.push(message);

    const handlers = this.subscribers.get(topic) || [];
    for (const handler of handlers) {
      await handler(message);
    }
  }
}

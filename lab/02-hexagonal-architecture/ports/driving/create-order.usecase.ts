// Nota pedagógica: uma porta primária (driving port) expõe apenas o contrato
// de entrada em termos de DTOs/primitivos. Ela NÃO depende do modelo de domínio
// (Order) — quem faz essa tradução é o serviço de aplicação. Manter a entidade de
// domínio fora daqui preserva a Regra da Dependência apontando para o núcleo.

export interface CreateOrderCommand {
  customerId: string;
  items: Array<{ sku: string; unitPrice: number; quantity: number }>;
  paymentToken: string;
}

export interface CreateOrderResult {
  orderId: string;
  total: number;
  status: string;
  transactionId: string;
}

export interface CreateOrderUseCase {
  execute(command: CreateOrderCommand): Promise<CreateOrderResult>;
}

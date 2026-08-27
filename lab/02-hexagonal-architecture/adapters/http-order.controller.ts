import type { CreateOrderUseCase } from '../ports/driving/create-order.usecase.js';

export interface HttpRequest {
  body: {
    customerId?: string;
    items?: Array<{ sku: string; unitPrice: number; quantity: number }>;
    paymentToken?: string;
  };
}

export interface HttpResponse {
  statusCode: number;
  body: Record<string, unknown>;
}

export class HttpOrderController {
  constructor(private readonly createOrderUseCase: CreateOrderUseCase) {}

  public async handleCreateOrder(request: HttpRequest): Promise<HttpResponse> {
    try {
      const { customerId, items, paymentToken } = request.body;
      if (!customerId || !items || !paymentToken) {
        return {
          statusCode: 400,
          body: { error: 'Missing required fields: customerId, items, paymentToken' },
        };
      }

      const result = await this.createOrderUseCase.execute({
        customerId,
        items,
        paymentToken,
      });

      return {
        statusCode: 201,
        body: {
          data: result,
          message: 'Order created and paid successfully',
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      return {
        statusCode: 422,
        body: { error: message },
      };
    }
  }
}

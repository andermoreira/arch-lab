/**
 * Retry com Backoff Exponencial + Jitter.
 *
 * Motivação (Fase 7 — AGENTS.md):
 *  - Retry ingênuo (intervalo fixo) sincroniza os clientes: quando um serviço
 *    downstream volta a responder, todos tentam ao mesmo tempo e o derrubam de
 *    novo (thundering herd / retry storm).
 *  - Backoff exponencial espalha as tentativas no tempo (base * 2^tentativa).
 *  - Jitter adiciona aleatoriedade ao delay para dessincronizar os clientes.
 *
 * O gerador de aleatoriedade (`random`) e o `sleep` são injetáveis para que o
 * comportamento seja 100% determinístico nos testes (sem flakiness e sem
 * esperar tempo real).
 */

export interface RetryOptions {
  /** Número máximo de tentativas (incluindo a primeira). */
  maxAttempts: number;
  /** Delay base em milissegundos para a primeira retentativa. */
  baseDelayMs: number;
  /** Teto do delay em milissegundos para evitar esperas absurdas. */
  maxDelayMs?: number;
  /**
   * Estratégia de jitter:
   *  - 'full': delay aleatório em [0, backoff] (recomendado pela AWS).
   *  - 'none': backoff exponencial puro, sem aleatoriedade.
   */
  jitter?: 'full' | 'none';
  /** Fonte de aleatoriedade injetável em [0, 1). Default: Math.random. */
  random?: () => number;
  /** Função de espera injetável. Default: setTimeout via Promise. */
  sleep?: (ms: number) => Promise<void>;
  /** Predicado para decidir se um erro é elegível para retry. Default: sempre. */
  isRetryable?: (error: unknown) => boolean;
}

export class RetryExhaustedError extends Error {
  constructor(
    public readonly attempts: number,
    public readonly lastError: unknown
  ) {
    const detail = lastError instanceof Error ? lastError.message : String(lastError);
    super(`Retry exhausted after ${attempts} attempt(s). Last error: ${detail}`);
    this.name = 'RetryExhaustedError';
  }
}

const defaultSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calcula o delay da próxima tentativa. Exposto para inspeção nos testes.
 *
 * @param attempt Índice da tentativa que acabou de falhar (0-based).
 */
export function computeBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitter: 'full' | 'none',
  random: () => number
): number {
  const exponential = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
  if (jitter === 'none') {
    return exponential;
  }
  // Full jitter: escolhe uniformemente entre 0 e o backoff exponencial.
  return Math.floor(random() * exponential);
}

export async function retryWithBackoff<T>(
  action: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxAttempts,
    baseDelayMs,
    maxDelayMs = 30_000,
    jitter = 'full',
    random = Math.random,
    sleep = defaultSleep,
    isRetryable = () => true,
  } = options;

  if (maxAttempts < 1) {
    throw new Error('maxAttempts must be >= 1');
  }

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === maxAttempts - 1;
      if (isLastAttempt || !isRetryable(error)) {
        break;
      }

      const delay = computeBackoffDelay(attempt, baseDelayMs, maxDelayMs, jitter, random);
      await sleep(delay);
    }
  }

  throw new RetryExhaustedError(maxAttempts, lastError);
}

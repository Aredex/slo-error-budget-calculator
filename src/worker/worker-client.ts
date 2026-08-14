import type { EngineRunResult } from '../domain/types';
import type { WorkerRequest, WorkerResponse } from './protocol';

/** Superficie mínima de un Worker real que el cliente necesita. Permite inyectar un doble de prueba. */
export interface WorkerLike {
  postMessage(message: WorkerRequest): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<WorkerResponse>) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent<WorkerResponse>) => void): void;
  terminate(): void;
}

export type WorkerFactory = () => WorkerLike;

export function defaultWorkerFactory(): WorkerLike {
  return new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike;
}

let counter = 0;
function nextRequestId(): string {
  counter += 1;
  return `req_${Date.now()}_${counter}`;
}

/**
 * Envuelve el Web Worker en una API basada en promesas con cancelación.
 * Cada instancia posee un único worker; `run` puede llamarse repetidamente,
 * cada llamada obtiene su propio `requestId` para no cruzar resultados.
 */
export class EngineWorkerClient {
  private worker: WorkerLike;
  private pending = new Map<
    string,
    { resolve: (value: EngineRunResult) => void }
  >();

  constructor(factory: WorkerFactory = defaultWorkerFactory) {
    this.worker = factory();
    this.worker.addEventListener('message', this.handleMessage);
  }

  private handleMessage = (event: MessageEvent<WorkerResponse>): void => {
    const message = event.data;
    const entry = this.pending.get(message.requestId);
    if (!entry) return;
    this.pending.delete(message.requestId);
    if (message.type === 'result') {
      entry.resolve(message.result);
    } else {
      entry.resolve({ output: message.output, detail: null });
    }
  };

  run(input: unknown): { requestId: string; promise: Promise<EngineRunResult> } {
    const requestId = nextRequestId();
    const promise = new Promise<EngineRunResult>((resolve) => {
      this.pending.set(requestId, { resolve });
    });
    this.worker.postMessage({ type: 'run', requestId, input });
    return { requestId, promise };
  }

  cancel(requestId: string): void {
    this.worker.postMessage({ type: 'cancel', requestId });
  }

  dispose(): void {
    this.worker.removeEventListener('message', this.handleMessage);
    this.worker.terminate();
  }
}

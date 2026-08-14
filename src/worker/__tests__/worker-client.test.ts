/**
 * Prueba de integración del cliente del worker (protocolo de mensajes +
 * cancelación) usando un doble de prueba que implementa la misma superficie
 * que un `Worker` real (`WorkerLike`), sin depender de un Worker real en el
 * entorno de test.
 */
import { describe, expect, it, vi } from 'vitest';
import { happyPathFixture } from '../../fixtures/happy-path';
import type { WorkerRequest, WorkerResponse } from '../protocol';
import { EngineWorkerClient } from '../worker-client';
import type { WorkerLike } from '../worker-client';

class FakeWorker implements WorkerLike {
  private listeners: Array<(event: MessageEvent<WorkerResponse>) => void> = [];
  public terminated = false;
  public posted: WorkerRequest[] = [];

  postMessage(message: WorkerRequest): void {
    this.posted.push(message);
  }

  addEventListener(_type: 'message', listener: (event: MessageEvent<WorkerResponse>) => void): void {
    this.listeners.push(listener);
  }

  removeEventListener(_type: 'message', listener: (event: MessageEvent<WorkerResponse>) => void): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  terminate(): void {
    this.terminated = true;
  }

  /** Simula que el worker respondió, para uso desde los tests. */
  emit(response: WorkerResponse): void {
    for (const listener of this.listeners) {
      listener({ data: response } as MessageEvent<WorkerResponse>);
    }
  }
}

describe('EngineWorkerClient', () => {
  it('envía un mensaje "run" con un requestId único y resuelve con el resultado recibido', async () => {
    const fake = new FakeWorker();
    const client = new EngineWorkerClient(() => fake);

    const { requestId, promise } = client.run(happyPathFixture);
    expect(fake.posted).toHaveLength(1);
    expect(fake.posted[0]).toEqual({ type: 'run', requestId, input: happyPathFixture });

    fake.emit({
      type: 'result',
      requestId,
      result: {
        output: {
          schemaVersion: '1.0.0',
          runId: 'run_x',
          status: 'completed',
          summary: 'ok',
          findings: [],
          evidence: { rulesVersion: '1.0.0', scenarioId: 'happy-path' },
        },
        detail: null,
      },
    });

    const result = await promise;
    expect(result.output.runId).toBe('run_x');
  });

  it('cancel() envía un mensaje "cancel" con el requestId correspondiente', () => {
    const fake = new FakeWorker();
    const client = new EngineWorkerClient(() => fake);
    const { requestId } = client.run(happyPathFixture);

    client.cancel(requestId);

    expect(fake.posted).toContainEqual({ type: 'cancel', requestId });
  });

  it('una respuesta "cancelled" resuelve la promesa con detail null y status cancelled', async () => {
    const fake = new FakeWorker();
    const client = new EngineWorkerClient(() => fake);
    const { requestId, promise } = client.run(happyPathFixture);

    fake.emit({
      type: 'cancelled',
      requestId,
      output: {
        schemaVersion: '1.0.0',
        runId: 'run_cancelled',
        status: 'cancelled',
        summary: 'cancelado',
        findings: [],
        evidence: { rulesVersion: '1.0.0', scenarioId: 'cancelled' },
      },
    });

    const result = await promise;
    expect(result.output.status).toBe('cancelled');
    expect(result.detail).toBeNull();
  });

  it('ignora mensajes con un requestId que ya no está pendiente', async () => {
    const fake = new FakeWorker();
    const client = new EngineWorkerClient(() => fake);
    const resolved = vi.fn();
    const { promise } = client.run(happyPathFixture);
    promise.then(resolved);

    fake.emit({
      type: 'result',
      requestId: 'otro-request-id-que-no-existe',
      result: {
        output: {
          schemaVersion: '1.0.0',
          runId: 'irrelevante',
          status: 'completed',
          summary: 'x',
          findings: [],
          evidence: { rulesVersion: '1.0.0', scenarioId: 'x' },
        },
        detail: null,
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(resolved).not.toHaveBeenCalled();
  });

  it('dispose() elimina el listener y termina el worker', () => {
    const fake = new FakeWorker();
    const client = new EngineWorkerClient(() => fake);
    client.dispose();
    expect(fake.terminated).toBe(true);
  });
});

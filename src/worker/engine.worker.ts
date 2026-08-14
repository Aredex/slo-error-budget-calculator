/// <reference lib="webworker" />
/**
 * Web Worker: ejecuta `runScenario` fuera del hilo principal y soporta
 * cancelación cooperativa. El worker nunca hace red ni accede a
 * almacenamiento; solo recibe el payload que el visitante ya tiene en su
 * navegador y devuelve el resultado.
 */
import { runScenario } from '../domain/engine';
import { RULES_VERSION } from '../domain/rules-version';
import { MIN_PROCESSING_MS } from './protocol';
import type { WorkerRequest, WorkerResponse } from './protocol';

const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

function post(message: WorkerResponse): void {
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(message);
}

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  if (message.type === 'cancel') {
    const timer = pendingTimers.get(message.requestId);
    if (timer !== undefined) {
      clearTimeout(timer);
      pendingTimers.delete(message.requestId);
      post({
        type: 'cancelled',
        requestId: message.requestId,
        output: {
          schemaVersion: '1.0.0',
          runId: `run_cancelled_${message.requestId}`,
          status: 'cancelled',
          summary: 'La ejecución fue cancelada por el visitante antes de completarse. No se conservó ningún dato.',
          findings: [
            {
              ruleId: 'RUN_CANCELLED',
              severity: 'info',
              message: 'El visitante canceló la ejecución.',
              suggestion: 'Vuelve a ejecutar el escenario cuando quieras.',
            },
          ],
          evidence: { rulesVersion: RULES_VERSION, scenarioId: 'cancelled' },
        },
      });
    }
    return;
  }

  if (message.type === 'run') {
    const timer = setTimeout(() => {
      pendingTimers.delete(message.requestId);
      const result = runScenario(message.input);
      post({ type: 'result', requestId: message.requestId, result });
    }, MIN_PROCESSING_MS);
    pendingTimers.set(message.requestId, timer);
  }
});

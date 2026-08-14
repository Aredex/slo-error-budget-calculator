import type { EngineOutput, EngineRunResult } from '../domain/types';

/** Mensajes que la interfaz principal envía al worker. */
export type WorkerRequest =
  | { type: 'run'; requestId: string; input: unknown }
  | { type: 'cancel'; requestId: string };

/** Mensajes que el worker envía de vuelta a la interfaz principal. */
export type WorkerResponse =
  | { type: 'result'; requestId: string; result: EngineRunResult }
  | { type: 'cancelled'; requestId: string; output: EngineOutput };

/**
 * Retraso artificial mínimo (ms) antes de resolver un cálculo. El cálculo en
 * sí es instantáneo (aritmética simple), pero el flujo de UX exige un estado
 * "procesando" cancelable (ver 03-ux-flujos-y-contenido.md, tabla de
 * estados). Se mantiene muy por debajo del presupuesto de 2s de primera
 * interacción (05-arquitectura-tecnica.md).
 */
export const MIN_PROCESSING_MS = 260;

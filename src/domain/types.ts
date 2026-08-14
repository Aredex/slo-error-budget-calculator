/**
 * Tipos del dominio SLO/Error Budget Calculator.
 *
 * Estos tipos representan la forma "rica" que usa la interfaz para
 * renderizar resultados. Son distintos (y más detallados) que el sobre
 * `EngineOutput`, que es el único contrato validado contra
 * `contracts/output.schema.json`.
 */

export type SchemaVersion = '1.0.0';

export type ScenarioId =
  | 'happy-path'
  | 'invalid-input'
  | 'boundary'
  | 'adversarial'
  | 'dependency-down'
  | string;

/** Envolvente de entrada, alineada con contracts/input.schema.json. */
export interface EngineInputEnvelope {
  schemaVersion: SchemaVersion;
  scenarioId: ScenarioId;
  payload: SloPayload;
  options: {
    deterministic: boolean;
  };
}

/** Unidad en la que se expresa el indicador (SLI). */
export type SliUnit = 'ratio' | 'percentage';

export interface SliInput {
  name: string;
  unit: SliUnit;
  /** Número de eventos "buenos" (éxito) observados en la ventana. */
  goodEvents: number;
  /** Número total de eventos observados en la ventana. */
  totalEvents: number;
}

export interface SloInput {
  /** Objetivo expresado como fracción estricta 0 < target < 1 (p.ej. 0.999). */
  target: number;
}

export type WindowType = 'rolling' | 'calendar';

export interface MeasurementWindowInput {
  type: WindowType;
  durationDays: number;
}

/** Un evento de incidente que consume presupuesto de error durante la simulación. */
export interface BurnEventInput {
  label: string;
  /** Hora de inicio del evento dentro de la ventana, en horas desde el inicio. */
  startHour: number;
  durationHours: number;
  /** Tasa de error observada durante el evento, 0 <= x <= 1. */
  errorRateDuringEvent: number;
}

/** Payload específico del dominio SLO, transportado dentro de `EngineInputEnvelope.payload`. */
export interface SloPayload {
  sli: SliInput;
  slo: SloInput;
  window: MeasurementWindowInput;
  burnEvents: BurnEventInput[];
  /** Objetivos adicionales a comparar contra `slo.target`. */
  compareTargets: number[];
}

export type Severity = 'info' | 'warning' | 'error' | 'critical';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ErrorBudgetResult {
  totalWindowMinutes: number;
  /** Minutos "malos" permitidos por el objetivo dentro de la ventana. */
  totalBudgetMinutes: number;
  /** Minutos "malos" ya consumidos según el SLI actual. */
  consumedMinutes: number;
  remainingMinutes: number;
  /** Fracción de presupuesto restante, 0..1 (puede ser negativa si se agotó). */
  remainingRatio: number;
  actualBadRatio: number;
  allowedBadRatio: number;
  status: 'healthy' | 'at-risk' | 'exhausted';
  confidence: ConfidenceLevel;
}

export interface BurnTimelinePoint {
  label: string;
  startHour: number;
  endHour: number;
  cumulativeConsumedMinutes: number;
  cumulativeConsumedRatio: number;
  burnRate: number;
  severity: Severity;
  alertWindow: '1h' | '6h' | '3d' | 'none';
}

export interface BurnSimulationResult {
  timeline: BurnTimelinePoint[];
  currentBurnRate: number;
  /** Días estimados hasta agotar el presupuesto restante al ritmo actual, null si no se agota. */
  projectedExhaustionDays: number | null;
  worstSeverity: Severity;
}

export interface ComparisonRow {
  target: number;
  isBaseline: boolean;
  budget: ErrorBudgetResult;
  projectedExhaustionDays: number | null;
}

export interface Assumption {
  id: string;
  text: string;
  confidence: ConfidenceLevel;
}

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  evidencePath?: string;
  suggestion?: string;
}

export interface EngineDetail {
  budget: ErrorBudgetResult;
  burn: BurnSimulationResult;
  comparisons: ComparisonRow[];
  assumptions: Assumption[];
}

export type EngineStatus = 'completed' | 'partial' | 'failed' | 'cancelled';

/** Sobre de salida, valida estrictamente contra contracts/output.schema.json. */
export interface EngineOutput {
  schemaVersion: SchemaVersion;
  runId: string;
  status: EngineStatus;
  summary: string;
  findings: Finding[];
  evidence: {
    rulesVersion: string;
    scenarioId: string;
  };
}

export interface EngineRunResult {
  output: EngineOutput;
  detail: EngineDetail | null;
}

export type ErrorCode =
  | 'INPUT_INVALID'
  | 'LIMIT_EXCEEDED'
  | 'RUN_CANCELLED'
  | 'DEPENDENCY_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface ValidationIssue {
  code: ErrorCode;
  path: string;
  message: string;
}

export interface ValidationFailure {
  ok: false;
  issues: ValidationIssue[];
}

export interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

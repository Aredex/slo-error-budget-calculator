/**
 * Límites de validación compartidos por el validador manual y los tests de
 * contrato. Mantenerlos centralizados evita divergencia entre el schema
 * documental (contracts/*.schema.json) y el validador real en runtime.
 */
export const LIMITS = {
  scenarioIdMaxLength: 80,
  payloadMaxProperties: 200,
  sliNameMaxLength: 120,
  burnEventsMax: 50,
  burnEventLabelMaxLength: 80,
  compareTargetsMax: 10,
  windowDurationDaysMin: 1,
  windowDurationDaysMax: 365,
  totalEventsMax: 1_000_000_000,
  findingsMax: 1000,
  summaryMaxLength: 500,
  findingMessageMaxLength: 1000,
  findingSuggestionMaxLength: 2000,
  findingEvidencePathMaxLength: 500,
} as const;

/** El objetivo nunca puede alcanzar el 100%: un 0% de presupuesto no es un objetivo demostrable. */
export const SLO_TARGET_MIN = 0.5;
export const SLO_TARGET_MAX = 0.999999;

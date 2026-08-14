/**
 * Validador manual del sobre de entrada.
 *
 * Implementa a mano las mismas reglas que contracts/input.schema.json y
 * contracts/payload.schema.json (documental). No se usa `ajv` en runtime
 * porque `ajv.compile()` genera código con `new Function(...)`, incompatible
 * con la CSP estricta (`script-src 'self'`, sin `unsafe-eval`). `ajv` solo se
 * usa en tests (ver src/domain/__tests__/contract.test.ts) para comprobar
 * que este validador no diverge del schema documental.
 */
import { LIMITS, SLO_TARGET_MAX, SLO_TARGET_MIN } from './limits';
import type {
  BurnEventInput,
  EngineInputEnvelope,
  MeasurementWindowInput,
  SliInput,
  SloInput,
  SloPayload,
  ValidationIssue,
  ValidationResult,
} from './types';

const SCENARIO_ID_PATTERN = /^[a-z0-9-]+$/;

function issue(path: string, message: string, code: ValidationIssue['code'] = 'INPUT_INVALID'): ValidationIssue {
  return { code, path, message };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Valida el sobre externo: schemaVersion, scenarioId, payload (forma genérica), options. */
export function validateEnvelopeShape(raw: unknown): ValidationResult<{
  schemaVersion: '1.0.0';
  scenarioId: string;
  payload: Record<string, unknown>;
  options: { deterministic: boolean };
}> {
  const issues: ValidationIssue[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, issues: [issue('$', 'La entrada debe ser un objeto JSON.')] };
  }

  const allowedKeys = new Set(['schemaVersion', 'scenarioId', 'payload', 'options']);
  for (const key of Object.keys(raw)) {
    if (!allowedKeys.has(key)) {
      issues.push(issue(`$.${key}`, `Propiedad no permitida: "${key}".`));
    }
  }

  if (raw.schemaVersion !== '1.0.0') {
    issues.push(issue('$.schemaVersion', 'schemaVersion debe ser exactamente "1.0.0".'));
  }

  if (
    typeof raw.scenarioId !== 'string' ||
    raw.scenarioId.length < 1 ||
    raw.scenarioId.length > LIMITS.scenarioIdMaxLength ||
    !SCENARIO_ID_PATTERN.test(raw.scenarioId)
  ) {
    issues.push(
      issue('$.scenarioId', 'scenarioId debe ser minúsculas/números/guiones, 1-80 caracteres.'),
    );
  }

  if (!isPlainObject(raw.payload)) {
    issues.push(issue('$.payload', 'payload debe ser un objeto.'));
  } else if (Object.keys(raw.payload).length > LIMITS.payloadMaxProperties) {
    issues.push(
      issue('$.payload', `payload excede el máximo de ${LIMITS.payloadMaxProperties} propiedades.`, 'LIMIT_EXCEEDED'),
    );
  }

  if (!isPlainObject(raw.options)) {
    issues.push(issue('$.options', 'options debe ser un objeto.'));
  } else {
    const optionKeys = new Set(Object.keys(raw.options));
    for (const key of optionKeys) {
      if (key !== 'deterministic') {
        issues.push(issue(`$.options.${key}`, `Propiedad no permitida en options: "${key}".`));
      }
    }
    if (typeof raw.options.deterministic !== 'boolean') {
      issues.push(issue('$.options.deterministic', 'options.deterministic debe ser booleano.'));
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      schemaVersion: '1.0.0',
      scenarioId: raw.scenarioId as string,
      payload: raw.payload as Record<string, unknown>,
      options: raw.options as { deterministic: boolean },
    },
  };
}

function validateSli(raw: unknown, issues: ValidationIssue[]): SliInput | null {
  if (!isPlainObject(raw)) {
    issues.push(issue('$.payload.sli', 'sli debe ser un objeto.'));
    return null;
  }
  const { name, unit, goodEvents, totalEvents } = raw;

  if (typeof name !== 'string' || name.trim().length === 0 || name.length > LIMITS.sliNameMaxLength) {
    issues.push(issue('$.payload.sli.name', `sli.name debe ser texto no vacío (máx. ${LIMITS.sliNameMaxLength} caracteres).`));
  }
  if (unit !== 'ratio' && unit !== 'percentage') {
    issues.push(issue('$.payload.sli.unit', 'sli.unit debe ser "ratio" o "percentage".'));
  }
  if (!isFiniteNumber(goodEvents) || goodEvents < 0 || goodEvents > LIMITS.totalEventsMax) {
    issues.push(issue('$.payload.sli.goodEvents', 'sli.goodEvents debe ser un número >= 0.'));
  }
  if (!isFiniteNumber(totalEvents) || totalEvents <= 0 || totalEvents > LIMITS.totalEventsMax) {
    issues.push(issue('$.payload.sli.totalEvents', 'sli.totalEvents debe ser un número > 0.'));
  }
  if (
    isFiniteNumber(goodEvents) &&
    isFiniteNumber(totalEvents) &&
    goodEvents > totalEvents
  ) {
    issues.push(
      issue('$.payload.sli.goodEvents', 'sli.goodEvents no puede superar sli.totalEvents.'),
    );
  }

  if (issues.length > 0) return null;
  return { name: name as string, unit: unit as SliInput['unit'], goodEvents: goodEvents as number, totalEvents: totalEvents as number };
}

function validateSlo(raw: unknown, issues: ValidationIssue[]): SloInput | null {
  if (!isPlainObject(raw)) {
    issues.push(issue('$.payload.slo', 'slo debe ser un objeto.'));
    return null;
  }
  const { target } = raw;
  if (!isFiniteNumber(target)) {
    issues.push(issue('$.payload.slo.target', 'slo.target debe ser numérico.'));
    return null;
  }
  if (target >= 1) {
    issues.push(
      issue(
        '$.payload.slo.target',
        'slo.target no puede ser 100% (1.0): un objetivo perfecto no deja presupuesto de error y no es alcanzable de forma sostenible.',
      ),
    );
  } else if (target < SLO_TARGET_MIN || target > SLO_TARGET_MAX) {
    issues.push(
      issue(
        '$.payload.slo.target',
        `slo.target debe estar entre ${SLO_TARGET_MIN} y ${SLO_TARGET_MAX} (excluyente de 1).`,
      ),
    );
  }
  if (issues.length > 0) return null;
  return { target: target as number };
}

function validateWindow(raw: unknown, issues: ValidationIssue[]): MeasurementWindowInput | null {
  if (!isPlainObject(raw)) {
    issues.push(issue('$.payload.window', 'window debe ser un objeto.'));
    return null;
  }
  const { type, durationDays } = raw;
  if (type !== 'rolling' && type !== 'calendar') {
    issues.push(issue('$.payload.window.type', 'window.type debe ser "rolling" o "calendar".'));
  }
  if (
    !isFiniteNumber(durationDays) ||
    durationDays < LIMITS.windowDurationDaysMin ||
    durationDays > LIMITS.windowDurationDaysMax
  ) {
    issues.push(
      issue(
        '$.payload.window.durationDays',
        `window.durationDays debe estar entre ${LIMITS.windowDurationDaysMin} y ${LIMITS.windowDurationDaysMax}.`,
      ),
    );
  }
  if (issues.length > 0) return null;
  return { type: type as MeasurementWindowInput['type'], durationDays: durationDays as number };
}

function validateBurnEvents(raw: unknown, issues: ValidationIssue[]): BurnEventInput[] | null {
  if (!Array.isArray(raw)) {
    issues.push(issue('$.payload.burnEvents', 'burnEvents debe ser un arreglo.'));
    return null;
  }
  if (raw.length > LIMITS.burnEventsMax) {
    issues.push(
      issue(
        '$.payload.burnEvents',
        `burnEvents excede el máximo de ${LIMITS.burnEventsMax} elementos.`,
        'LIMIT_EXCEEDED',
      ),
    );
    return null;
  }

  const events: BurnEventInput[] = [];
  raw.forEach((item, index) => {
    const path = `$.payload.burnEvents[${index}]`;
    if (!isPlainObject(item)) {
      issues.push(issue(path, 'cada evento debe ser un objeto.'));
      return;
    }
    const { label, startHour, durationHours, errorRateDuringEvent } = item;
    if (typeof label !== 'string' || label.trim().length === 0 || label.length > LIMITS.burnEventLabelMaxLength) {
      issues.push(issue(`${path}.label`, `label debe ser texto no vacío (máx. ${LIMITS.burnEventLabelMaxLength} caracteres).`));
    }
    if (!isFiniteNumber(startHour) || startHour < 0) {
      issues.push(issue(`${path}.startHour`, 'startHour debe ser un número >= 0.'));
    }
    if (!isFiniteNumber(durationHours) || durationHours <= 0) {
      issues.push(issue(`${path}.durationHours`, 'durationHours debe ser un número > 0.'));
    }
    if (!isFiniteNumber(errorRateDuringEvent) || errorRateDuringEvent < 0 || errorRateDuringEvent > 1) {
      issues.push(issue(`${path}.errorRateDuringEvent`, 'errorRateDuringEvent debe estar entre 0 y 1.'));
    }
    if (
      typeof label === 'string' &&
      isFiniteNumber(startHour) &&
      isFiniteNumber(durationHours) &&
      isFiniteNumber(errorRateDuringEvent)
    ) {
      events.push({ label, startHour, durationHours, errorRateDuringEvent });
    }
  });

  if (issues.length > 0) return null;
  return events;
}

function validateCompareTargets(raw: unknown, issues: ValidationIssue[]): number[] | null {
  if (!Array.isArray(raw)) {
    issues.push(issue('$.payload.compareTargets', 'compareTargets debe ser un arreglo.'));
    return null;
  }
  if (raw.length > LIMITS.compareTargetsMax) {
    issues.push(
      issue(
        '$.payload.compareTargets',
        `compareTargets excede el máximo de ${LIMITS.compareTargetsMax} elementos.`,
        'LIMIT_EXCEEDED',
      ),
    );
    return null;
  }
  const targets: number[] = [];
  raw.forEach((value, index) => {
    const path = `$.payload.compareTargets[${index}]`;
    if (!isFiniteNumber(value)) {
      issues.push(issue(path, 'cada objetivo de comparación debe ser numérico.'));
      return;
    }
    if (value >= 1) {
      issues.push(issue(path, 'un objetivo de comparación no puede ser 100% (1.0).'));
      return;
    }
    if (value < SLO_TARGET_MIN || value > SLO_TARGET_MAX) {
      issues.push(issue(path, `debe estar entre ${SLO_TARGET_MIN} y ${SLO_TARGET_MAX}.`));
      return;
    }
    targets.push(value);
  });
  if (issues.length > 0) return null;
  return targets;
}

/** Valida el payload específico del dominio SLO (más allá de la forma genérica del sobre). */
export function validatePayload(raw: Record<string, unknown>): ValidationResult<SloPayload> {
  const issues: ValidationIssue[] = [];

  const allowedKeys = new Set(['sli', 'slo', 'window', 'burnEvents', 'compareTargets']);
  for (const key of Object.keys(raw)) {
    if (!allowedKeys.has(key)) {
      issues.push(issue(`$.payload.${key}`, `Propiedad no permitida en payload: "${key}".`));
    }
  }

  const sli = validateSli(raw.sli, issues);
  const slo = validateSlo(raw.slo, issues);
  const window = validateWindow(raw.window, issues);
  const burnEvents = validateBurnEvents(raw.burnEvents ?? [], issues);
  const compareTargets = validateCompareTargets(raw.compareTargets ?? [], issues);

  if (issues.length > 0 || !sli || !slo || !window || !burnEvents || !compareTargets) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: { sli, slo, window, burnEvents, compareTargets },
  };
}

/** Valida el sobre completo (forma genérica + payload de dominio) en un solo paso. */
export function validateInput(raw: unknown): ValidationResult<EngineInputEnvelope> {
  const envelopeResult = validateEnvelopeShape(raw);
  if (!envelopeResult.ok) {
    return envelopeResult;
  }
  const payloadResult = validatePayload(envelopeResult.value.payload);
  if (!payloadResult.ok) {
    return payloadResult;
  }
  return {
    ok: true,
    value: {
      schemaVersion: envelopeResult.value.schemaVersion,
      scenarioId: envelopeResult.value.scenarioId,
      payload: payloadResult.value,
      options: envelopeResult.value.options,
    },
  };
}

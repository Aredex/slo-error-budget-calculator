/**
 * Pruebas de contrato: usan `ajv` (solo en tests, nunca en runtime del
 * navegador) para comprobar que:
 *  1. El validador manual (validation.ts) no diverge de
 *     contracts/input.schema.json: mismos veredictos ok/fail para el mismo
 *     conjunto de casos.
 *  2. La salida de `runScenario` siempre cumple contracts/output.schema.json,
 *     para cualquier fixture, incluidos los casos de error.
 */
import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  adversarialFixture,
  boundaryFixture,
  dependencyDownFixture,
  happyPathFixture,
  invalidInputFixture,
} from '../../fixtures';
import { runScenario } from '../engine';
import { validateInput } from '../validation';

const here = dirname(fileURLToPath(import.meta.url));
const contractsDir = resolve(here, '../../../contracts');

const ajv = new Ajv2020({ strict: true, allErrors: true });
const inputSchema = JSON.parse(readFileSync(resolve(contractsDir, 'input.schema.json'), 'utf-8'));
const outputSchema = JSON.parse(readFileSync(resolve(contractsDir, 'output.schema.json'), 'utf-8'));
const validateInputSchema = ajv.compile(inputSchema);
const validateOutputSchema = ajv.compile(outputSchema);

describe('contrato: input.schema.json', () => {
  const cases: Array<[string, unknown]> = [
    ['happy-path', happyPathFixture],
    ['boundary', boundaryFixture],
    ['adversarial', adversarialFixture],
    ['dependency-down', dependencyDownFixture],
    ['invalid-input (target 100%)', invalidInputFixture],
    ['no es un objeto', 'string'],
    ['sin schemaVersion', { scenarioId: 'x', payload: {}, options: { deterministic: true } }],
  ];

  it.each(cases)('%s: el validador manual coincide con ajv', (_name, fixture) => {
    const ajvValid = validateInputSchema(fixture);
    const manualResult = validateEnvelopeOnlyForComparison(fixture);
    expect(manualResult.ok).toBe(ajvValid);
  });
});

describe('contrato: output.schema.json', () => {
  const fixtures: Array<[string, unknown]> = [
    ['happy-path', happyPathFixture],
    ['boundary', boundaryFixture],
    ['adversarial', adversarialFixture],
    ['dependency-down', dependencyDownFixture],
    ['invalid-input', invalidInputFixture],
  ];

  it.each(fixtures)('la salida de runScenario para %s cumple el schema', (_name, fixture) => {
    const { output } = runScenario(fixture, { runIdSeed: 'contract-test' });
    const valid = validateOutputSchema(output);
    if (!valid) {
      console.error(validateOutputSchema.errors);
    }
    expect(valid).toBe(true);
  });
});

/**
 * El validador manual valida en dos pasos (sobre + payload de dominio). Para
 * comparar contra ajv (que solo conoce la forma genérica del sobre, ya que
 * `payload` es un objeto abierto en el schema publicado) reproducimos aquí
 * únicamente el resultado de la forma del sobre, no las reglas de negocio
 * adicionales del payload (esas son responsabilidad de este proyecto, no del
 * contrato compartido).
 */
function validateEnvelopeOnlyForComparison(raw: unknown): { ok: boolean } {
  const result = validateInput(raw);
  if (result.ok) return { ok: true };
  // Si falló únicamente por reglas de negocio del payload (no por la forma
  // del sobre), ajv seguiría considerando el sobre válido porque su
  // `payload` es un objeto genérico. Filtramos esos casos para comparar solo
  // la forma del sobre.
  const onlyPayloadBusinessRules = result.issues.every((issue) => issue.path.startsWith('$.payload.'));
  if (onlyPayloadBusinessRules && isPlainObjectEnvelopeShapeValid(raw)) {
    return { ok: true };
  }
  return { ok: false };
}

function isPlainObjectEnvelopeShapeValid(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  const allowedKeys = new Set(['schemaVersion', 'scenarioId', 'payload', 'options']);
  if (!Object.keys(obj).every((k) => allowedKeys.has(k))) return false;
  if (obj.schemaVersion !== '1.0.0') return false;
  if (typeof obj.scenarioId !== 'string' || !/^[a-z0-9-]{1,80}$/.test(obj.scenarioId)) return false;
  if (typeof obj.payload !== 'object' || obj.payload === null) return false;
  if (typeof obj.options !== 'object' || obj.options === null) return false;
  return true;
}

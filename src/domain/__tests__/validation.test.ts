import { describe, expect, it } from 'vitest';
import { happyPathFixture } from '../../fixtures/happy-path';
import { validateInput } from '../validation';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

describe('validateInput', () => {
  it('acepta el fixture feliz', () => {
    const result = validateInput(happyPathFixture);
    expect(result.ok).toBe(true);
  });

  it('rechaza un objetivo del 100% con un mensaje accionable', () => {
    const input = clone(happyPathFixture);
    input.payload.slo.target = 1;
    const result = validateInput(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === '$.payload.slo.target')).toBe(true);
      expect(result.issues[0].message).toMatch(/100%/);
    }
  });

  it('rechaza schemaVersion distinta de 1.0.0', () => {
    const input = clone(happyPathFixture) as unknown as Record<string, unknown>;
    input.schemaVersion = '2.0.0';
    const result = validateInput(input);
    expect(result.ok).toBe(false);
  });

  it('rechaza scenarioId con mayúsculas o caracteres no permitidos', () => {
    const input = clone(happyPathFixture);
    input.scenarioId = 'Not Valid!';
    const result = validateInput(input);
    expect(result.ok).toBe(false);
  });

  it('rechaza propiedades no declaradas (additionalProperties false)', () => {
    const input = clone(happyPathFixture) as unknown as Record<string, unknown>;
    input.extra = 'no permitido';
    const result = validateInput(input);
    expect(result.ok).toBe(false);
  });

  it('rechaza ventana fuera de rango (> 365 días)', () => {
    const input = clone(happyPathFixture);
    input.payload.window.durationDays = 400;
    const result = validateInput(input);
    expect(result.ok).toBe(false);
  });

  it('acepta la ventana exactamente en el límite superior (365 días)', () => {
    const input = clone(happyPathFixture);
    input.payload.window.durationDays = 365;
    const result = validateInput(input);
    expect(result.ok).toBe(true);
  });

  it('rechaza goodEvents mayor que totalEvents', () => {
    const input = clone(happyPathFixture);
    input.payload.sli.goodEvents = input.payload.sli.totalEvents + 1;
    const result = validateInput(input);
    expect(result.ok).toBe(false);
  });

  it('rechaza más de 10 objetivos de comparación', () => {
    const input = clone(happyPathFixture);
    input.payload.compareTargets = Array.from({ length: 11 }, (_, i) => 0.9 + i * 0.001);
    const result = validateInput(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.code === 'LIMIT_EXCEEDED')).toBe(true);
    }
  });

  it('rechaza contenido que no es un objeto', () => {
    const result = validateInput('esto no es un objeto');
    expect(result.ok).toBe(false);
  });

  it('acepta contenido hostil en campos de texto sin ejecutarlo (solo texto)', () => {
    const input = clone(happyPathFixture);
    input.payload.sli.name = '<script>alert(1)</script>';
    const result = validateInput(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.payload.sli.name).toBe('<script>alert(1)</script>');
    }
  });
});

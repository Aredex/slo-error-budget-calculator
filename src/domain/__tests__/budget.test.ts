import { describe, expect, it } from 'vitest';
import { assessConfidence, calculateBudget } from '../budget';

describe('calculateBudget', () => {
  it('calcula un presupuesto saludable cuando el SLI supera el objetivo', () => {
    const result = calculateBudget(
      { name: 'test', unit: 'ratio', goodEvents: 999_500, totalEvents: 1_000_000 },
      { target: 0.999 },
      { type: 'rolling', durationDays: 30 },
    );

    expect(result.status).toBe('healthy');
    expect(result.remainingRatio).toBeGreaterThan(0.2);
    expect(result.totalWindowMinutes).toBe(30 * 24 * 60);
  });

  it('marca el presupuesto como agotado cuando el bad ratio supera el permitido', () => {
    const result = calculateBudget(
      { name: 'test', unit: 'ratio', goodEvents: 990_000, totalEvents: 1_000_000 },
      { target: 0.999 },
      { type: 'rolling', durationDays: 30 },
    );

    expect(result.status).toBe('exhausted');
    expect(result.remainingRatio).toBeLessThanOrEqual(0);
  });

  it('marca "at-risk" cuando queda menos del 20% del presupuesto', () => {
    // allowed=0.001, actual debe estar entre 0.0008 y 0.001 para dejar 0-20% restante
    const result = calculateBudget(
      { name: 'test', unit: 'ratio', goodEvents: 999_100, totalEvents: 1_000_000 },
      { target: 0.999 },
      { type: 'rolling', durationDays: 30 },
    );

    expect(result.status).toBe('at-risk');
  });

  it('es determinista: mismos argumentos producen el mismo resultado', () => {
    const args = [
      { name: 'a', unit: 'ratio' as const, goodEvents: 100, totalEvents: 200 },
      { target: 0.9 },
      { type: 'rolling' as const, durationDays: 7 },
    ] as const;
    const a = calculateBudget(...args);
    const b = calculateBudget(...args);
    expect(a).toEqual(b);
  });

  describe('assessConfidence', () => {
    it('clasifica muestras pequeñas como baja confianza', () => {
      expect(assessConfidence(50)).toBe('low');
    });
    it('clasifica muestras medianas', () => {
      expect(assessConfidence(5000)).toBe('medium');
    });
    it('clasifica muestras grandes como alta confianza', () => {
      expect(assessConfidence(200_000)).toBe('high');
    });
  });
});

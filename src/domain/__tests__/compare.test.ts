import { describe, expect, it } from 'vitest';
import { compareObjectives } from '../compare';

const sli = { name: 'test', unit: 'ratio' as const, goodEvents: 999_500, totalEvents: 1_000_000 };
const window = { type: 'rolling' as const, durationDays: 30 };

describe('compareObjectives', () => {
  it('incluye el objetivo base marcado como baseline', () => {
    const rows = compareObjectives(sli, window, 0.999, [0.995, 0.9995], []);
    const baseline = rows.find((r) => r.isBaseline);
    expect(baseline).toBeDefined();
    expect(baseline!.target).toBe(0.999);
  });

  it('ordena de mayor a menor objetivo', () => {
    const rows = compareObjectives(sli, window, 0.999, [0.995, 0.9995], []);
    const targets = rows.map((r) => r.target);
    expect(targets).toEqual([...targets].sort((a, b) => b - a));
  });

  it('deduplica objetivos repetidos', () => {
    const rows = compareObjectives(sli, window, 0.999, [0.999, 0.995], []);
    const targets = rows.map((r) => r.target);
    expect(new Set(targets).size).toBe(targets.length);
    expect(targets).toHaveLength(2);
  });

  it('un objetivo más laxo siempre tiene igual o más presupuesto que uno más estricto', () => {
    const rows = compareObjectives(sli, window, 0.999, [0.99], []);
    const strict = rows.find((r) => r.target === 0.999)!;
    const loose = rows.find((r) => r.target === 0.99)!;
    expect(loose.budget.totalBudgetMinutes).toBeGreaterThan(strict.budget.totalBudgetMinutes);
  });
});

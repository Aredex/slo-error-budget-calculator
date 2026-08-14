/**
 * `compareObjectives` — compara el objetivo base contra objetivos alternativos
 * usando el mismo SLI y ventana, para responder "¿cuánto presupuesto gano o
 * pierdo si cambio el objetivo?".
 */
import { calculateBudget } from './budget';
import { simulateBurn } from './burn';
import type { BurnEventInput, ComparisonRow, MeasurementWindowInput, SliInput, SloInput } from './types';

export function compareObjectives(
  sli: SliInput,
  window: MeasurementWindowInput,
  baselineTarget: number,
  compareTargets: number[],
  burnEvents: BurnEventInput[],
): ComparisonRow[] {
  const allTargets = [baselineTarget, ...compareTargets];
  // Deduplicar preservando el orden y marcando el primero como baseline.
  const seen = new Set<number>();
  const rows: ComparisonRow[] = [];

  for (const target of allTargets) {
    if (seen.has(target)) continue;
    seen.add(target);
    const slo: SloInput = { target };
    const budget = calculateBudget(sli, slo, window);
    const burn = simulateBurn(budget, burnEvents);
    rows.push({
      target,
      isBaseline: target === baselineTarget,
      budget,
      projectedExhaustionDays: burn.projectedExhaustionDays,
    });
  }

  return rows.sort((a, b) => b.target - a.target);
}

import { describe, expect, it } from 'vitest';
import { calculateBudget } from '../budget';
import { simulateBurn } from '../burn';

const sli = { name: 'test', unit: 'ratio' as const, goodEvents: 999_500, totalEvents: 1_000_000 };
const slo = { target: 0.999 };
const window = { type: 'rolling' as const, durationDays: 30 };

describe('simulateBurn', () => {
  it('no genera hallazgos de severidad alta cuando no hay eventos', () => {
    const budget = calculateBudget(sli, slo, window);
    const result = simulateBurn(budget, []);
    expect(result.timeline).toHaveLength(0);
    expect(result.worstSeverity).toBe('info');
  });

  it('clasifica un burn rate crítico (>=14.4x) correctamente', () => {
    const budget = calculateBudget(sli, slo, window);
    // allowedBadRatio = 0.001; errorRateDuringEvent = 0.02 -> burnRate = 20x
    const result = simulateBurn(budget, [
      { label: 'incidente mayor', startHour: 0, durationHours: 1, errorRateDuringEvent: 0.02 },
    ]);
    expect(result.timeline[0].severity).toBe('critical');
    expect(result.timeline[0].alertWindow).toBe('1h');
  });

  it('ordena los eventos por hora de inicio antes de simular', () => {
    const budget = calculateBudget(sli, slo, window);
    const result = simulateBurn(budget, [
      { label: 'segundo', startHour: 10, durationHours: 1, errorRateDuringEvent: 0.001 },
      { label: 'primero', startHour: 0, durationHours: 1, errorRateDuringEvent: 0.001 },
    ]);
    expect(result.timeline[0].label).toBe('primero');
    expect(result.timeline[1].label).toBe('segundo');
  });

  it('proyecta agotamiento cuando un evento reciente tiene burn rate > 1x y aún queda presupuesto', () => {
    const budget = calculateBudget(sli, slo, window); // SLI base saludable
    const result = simulateBurn(budget, [
      { label: 'incidente moderado', startHour: 0, durationHours: 1, errorRateDuringEvent: 0.003 },
    ]);
    expect(result.currentBurnRate).toBeCloseTo(3, 5);
    expect(result.projectedExhaustionDays).not.toBeNull();
    expect(result.projectedExhaustionDays!).toBeGreaterThan(0);
  });

  it('reporta agotamiento inmediato (0 días) cuando el presupuesto ya quedó negativo', () => {
    const highBurnSli = { name: 'test', unit: 'ratio' as const, goodEvents: 990_000, totalEvents: 1_000_000 };
    const budget = calculateBudget(highBurnSli, slo, window);
    const result = simulateBurn(budget, []);
    expect(budget.status).toBe('exhausted');
    expect(result.projectedExhaustionDays).toBe(0);
  });

  it('no proyecta agotamiento cuando el burn rate es sostenible', () => {
    const budget = calculateBudget(sli, slo, window);
    const result = simulateBurn(budget, []);
    expect(result.projectedExhaustionDays).toBeNull();
  });
});

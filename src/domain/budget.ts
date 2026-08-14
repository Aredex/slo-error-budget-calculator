/**
 * `calculateBudget` — presupuesto de error a partir de SLI, SLO y ventana.
 *
 * Fórmulas (estándar SRE, ver Google Cloud Architecture Framework —
 * "Set realistic reliability targets", enlazado en 05-arquitectura-tecnica.md):
 *
 *   allowedBadRatio   = 1 - slo.target
 *   totalWindowMinutes = window.durationDays * 24 * 60
 *   totalBudgetMinutes = totalWindowMinutes * allowedBadRatio
 *   actualBadRatio    = 1 - (sli.goodEvents / sli.totalEvents)
 *   consumedMinutes   = totalWindowMinutes * actualBadRatio
 *   remainingMinutes  = totalBudgetMinutes - consumedMinutes
 *   remainingRatio    = remainingMinutes / totalBudgetMinutes
 *
 * El cálculo es puro y determinista: mismos argumentos, mismo resultado.
 */
import type { ConfidenceLevel, ErrorBudgetResult, MeasurementWindowInput, SliInput, SloInput } from './types';

const MINUTES_PER_DAY = 24 * 60;

/**
 * Nivel de confianza declarado explícitamente: un SLI con pocos eventos totales
 * produce una estimación de presupuesto poco fiable, aunque la aritmética sea
 * correcta. Ver riesgo "precisión engañosa" en 08-seguridad-privacidad.md.
 */
export function assessConfidence(totalEvents: number): ConfidenceLevel {
  if (totalEvents >= 100_000) return 'high';
  if (totalEvents >= 1_000) return 'medium';
  return 'low';
}

export function calculateBudget(sli: SliInput, slo: SloInput, window: MeasurementWindowInput): ErrorBudgetResult {
  const totalWindowMinutes = window.durationDays * MINUTES_PER_DAY;
  const allowedBadRatio = 1 - slo.target;
  const totalBudgetMinutes = totalWindowMinutes * allowedBadRatio;

  const actualBadRatio = sli.totalEvents > 0 ? 1 - sli.goodEvents / sli.totalEvents : 0;
  const consumedMinutes = totalWindowMinutes * actualBadRatio;
  const remainingMinutes = totalBudgetMinutes - consumedMinutes;
  const remainingRatio = totalBudgetMinutes > 0 ? remainingMinutes / totalBudgetMinutes : 0;

  let status: ErrorBudgetResult['status'] = 'healthy';
  if (remainingRatio <= 0) {
    status = 'exhausted';
  } else if (remainingRatio < 0.2) {
    status = 'at-risk';
  }

  return {
    totalWindowMinutes,
    totalBudgetMinutes,
    consumedMinutes,
    remainingMinutes,
    remainingRatio,
    actualBadRatio,
    allowedBadRatio,
    status,
    confidence: assessConfidence(sli.totalEvents),
  };
}

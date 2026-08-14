/**
 * `simulateBurn` — simulación de consumo de presupuesto ante una serie de
 * eventos (incidentes) y clasificación multi-ventana del burn rate, siguiendo
 * el esquema de alertado del Google SRE Workbook (burn rate = velocidad de
 * consumo relativa a la velocidad sostenible para agotar el presupuesto
 * exactamente al final de la ventana):
 *
 *   burnRate = actualBadRatioDuranteElEvento / allowedBadRatio
 *
 * Un burnRate de 1 agota el presupuesto justo al final de la ventana si se
 * mantuviera constante. Umbrales de severidad (aproximación de las alertas
 * "fast burn" / "slow burn" del workbook, adaptados a un único cálculo):
 *   >= 14.4  -> critical (agotaría el presupuesto en menos de ~1/14.4 de la ventana)
 *   >= 6     -> error
 *   >= 3     -> warning
 *   >  1     -> info
 *   <= 1     -> none (sostenible)
 */
import type { BurnEventInput, BurnSimulationResult, BurnTimelinePoint, ErrorBudgetResult, Severity } from './types';

function classifyBurnRate(rate: number): { severity: Severity; alertWindow: BurnTimelinePoint['alertWindow'] } {
  if (rate >= 14.4) return { severity: 'critical', alertWindow: '1h' };
  if (rate >= 6) return { severity: 'error', alertWindow: '6h' };
  if (rate >= 3) return { severity: 'warning', alertWindow: '3d' };
  if (rate > 1) return { severity: 'info', alertWindow: 'none' };
  return { severity: 'info', alertWindow: 'none' };
}

const SEVERITY_RANK: Record<Severity, number> = { info: 0, warning: 1, error: 2, critical: 3 };

export function simulateBurn(budget: ErrorBudgetResult, events: BurnEventInput[]): BurnSimulationResult {
  const sortedEvents = [...events].sort((a, b) => a.startHour - b.startHour);

  let cumulativeConsumedMinutes = budget.consumedMinutes;
  let worstSeverity: Severity = 'info';
  const timeline: BurnTimelinePoint[] = [];

  for (const event of sortedEvents) {
    const eventMinutes = event.durationHours * 60 * event.errorRateDuringEvent;
    cumulativeConsumedMinutes += eventMinutes;
    const cumulativeConsumedRatio =
      budget.totalBudgetMinutes > 0 ? cumulativeConsumedMinutes / budget.totalBudgetMinutes : 0;

    const eventBurnRate =
      budget.allowedBadRatio > 0 ? event.errorRateDuringEvent / budget.allowedBadRatio : 0;
    const { severity, alertWindow } = classifyBurnRate(eventBurnRate);

    if (SEVERITY_RANK[severity] > SEVERITY_RANK[worstSeverity]) {
      worstSeverity = severity;
    }

    timeline.push({
      label: event.label,
      startHour: event.startHour,
      endHour: event.startHour + event.durationHours,
      cumulativeConsumedMinutes,
      cumulativeConsumedRatio,
      burnRate: eventBurnRate,
      severity,
      alertWindow,
    });
  }

  const finalRemainingMinutes = budget.totalBudgetMinutes - cumulativeConsumedMinutes;

  // El "burn rate actual" para proyectar hacia adelante es el del evento más
  // reciente si hay eventos (tendencia reciente); si no hay eventos, es el
  // promedio implícito en el SLI acumulado de toda la ventana.
  const lastEvent = timeline.length > 0 ? timeline[timeline.length - 1] : undefined;
  const currentBurnRate =
    lastEvent !== undefined
      ? lastEvent.burnRate
      : budget.allowedBadRatio > 0
        ? budget.actualBadRatio / budget.allowedBadRatio
        : 0;

  let projectedExhaustionDays: number | null = null;
  if (finalRemainingMinutes <= 0) {
    projectedExhaustionDays = 0;
  } else if (currentBurnRate > 1) {
    const windowDays = budget.totalWindowMinutes / (24 * 60);
    const budgetMinutesPerDay = budget.totalBudgetMinutes / windowDays;
    const consumptionRatePerDay = currentBurnRate * budgetMinutesPerDay;
    projectedExhaustionDays = consumptionRatePerDay > 0 ? finalRemainingMinutes / consumptionRatePerDay : null;
  }

  return {
    timeline,
    currentBurnRate,
    projectedExhaustionDays,
    worstSeverity,
  };
}

/**
 * `explainDecisions` — hace visibles los supuestos detrás del cálculo, para
 * que un revisor pueda auditar el resultado sin leer el código. Mitiga el
 * riesgo "precisión engañosa" (08-seguridad-privacidad.md): nunca se muestra
 * un número sin su nivel de confianza y sus límites.
 */
import type {
  Assumption,
  BurnEventInput,
  ErrorBudgetResult,
  MeasurementWindowInput,
  SliInput,
  SloInput,
} from './types';

export function explainDecisions(
  sli: SliInput,
  slo: SloInput,
  window: MeasurementWindowInput,
  budget: ErrorBudgetResult,
  burnEvents: BurnEventInput[],
): Assumption[] {
  const assumptions: Assumption[] = [
    {
      id: 'window-uniform-traffic',
      text: `La ventana de ${window.durationDays} días (${window.type === 'rolling' ? 'móvil' : 'de calendario'}) asume tráfico distribuido de forma razonablemente uniforme. Picos muy concentrados de tráfico pueden hacer que el presupuesto real se agote antes de lo estimado.`,
      confidence: 'medium',
    },
    {
      id: 'sli-sample-size',
      text: `El indicador "${sli.name}" se calculó sobre ${sli.totalEvents.toLocaleString('es-ES')} eventos totales. ${
        budget.confidence === 'low'
          ? 'La muestra es pequeña: trata este resultado como orientativo, no como medición operativa.'
          : budget.confidence === 'medium'
            ? 'La muestra es moderada: razonable para decisiones internas, insuficiente para compromisos externos estrictos.'
            : 'La muestra es amplia: el resultado es representativo del comportamiento medido.'
      }`,
      confidence: budget.confidence,
    },
    {
      id: 'burn-rate-projection',
      text:
        burnEvents.length > 0
          ? 'La proyección de agotamiento asume que el burn rate observado en los eventos simulados se mantiene constante. Un cambio en la causa raíz cambia la proyección de inmediato.'
          : 'No se registraron eventos de incidente en este escenario: la proyección de agotamiento refleja únicamente el consumo constante implícito en el SLI actual.',
      confidence: 'medium',
    },
    {
      id: 'objective-not-perfection',
      text: `El objetivo (${(slo.target * 100).toFixed(3)}%) es siempre estrictamente menor que 100%: un objetivo perfecto no deja presupuesto de error y no es una meta operativa alcanzable de forma sostenible.`,
      confidence: 'high',
    },
  ];

  return assumptions;
}

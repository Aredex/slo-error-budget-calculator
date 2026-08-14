import type { EngineInputEnvelope } from '../domain/types';

/**
 * Fixture feliz: SLI con muestra amplia, objetivo estándar de la industria
 * (99.9%), ventana móvil de 30 días, un incidente moderado y dos objetivos
 * alternativos para comparar. Produce un resultado sin advertencias críticas.
 */
export const happyPathFixture: EngineInputEnvelope = {
  schemaVersion: '1.0.0',
  scenarioId: 'happy-path',
  payload: {
    sli: {
      name: 'Disponibilidad de la API de checkout',
      unit: 'ratio',
      goodEvents: 4_997_000,
      totalEvents: 5_000_000,
    },
    slo: { target: 0.999 },
    window: { type: 'rolling', durationDays: 30 },
    burnEvents: [
      { label: 'Despliegue con regresión menor', startHour: 120, durationHours: 2, errorRateDuringEvent: 0.0035 },
    ],
    compareTargets: [0.995, 0.9995],
  },
  options: { deterministic: true },
};

import type { EngineInputEnvelope } from '../domain/types';

/**
 * Fixture límite: ventana máxima (365 días), objetivo casi perfecto en el
 * borde permitido y el número máximo de objetivos de comparación. Verifica
 * que los límites documentados en contracts/ se aplican como "hasta e
 * incluyendo", no como aproximación.
 */
export const boundaryFixture: EngineInputEnvelope = {
  schemaVersion: '1.0.0',
  scenarioId: 'boundary',
  payload: {
    sli: {
      name: 'Éxito de escritura en base de datos',
      unit: 'ratio',
      goodEvents: 999_999,
      totalEvents: 1_000_000,
    },
    slo: { target: 0.999999 },
    window: { type: 'calendar', durationDays: 365 },
    burnEvents: Array.from({ length: 10 }, (_, i) => ({
      label: `Incidente sintético ${i + 1}`,
      startHour: i * 100,
      durationHours: 1,
      errorRateDuringEvent: 0.0001,
    })),
    compareTargets: [0.5, 0.99, 0.995, 0.999, 0.9995, 0.9999, 0.99995, 0.99999, 0.999995, 0.999999],
  },
  options: { deterministic: true },
};

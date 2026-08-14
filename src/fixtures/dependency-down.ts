import type { EngineInputEnvelope } from '../domain/types';

/**
 * Fixture "adaptador caído": no existe un adaptador real en este proyecto
 * (P2, fuera de alcance v1), pero el escenario demuestra el fallback
 * documentado en 11-despliegue-operacion.md: si un tercero no responde, la
 * app sigue sirviendo el cálculo en modo determinista local y lo declara
 * explícitamente en un hallazgo `DEPENDENCY_UNAVAILABLE`.
 */
export const dependencyDownFixture: EngineInputEnvelope = {
  schemaVersion: '1.0.0',
  scenarioId: 'dependency-down',
  payload: {
    sli: {
      name: 'Disponibilidad del servicio de pagos',
      unit: 'ratio',
      goodEvents: 98_500,
      totalEvents: 100_000,
    },
    slo: { target: 0.999 },
    window: { type: 'rolling', durationDays: 30 },
    burnEvents: [],
    compareTargets: [],
  },
  options: { deterministic: true },
};

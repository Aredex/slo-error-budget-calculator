import type { EngineInputEnvelope } from '../domain/types';

/**
 * Fixture adversarial: contenido hostil (intento de XSS y caracteres de
 * control) en campos de texto. El motor no ejecuta ni interpreta estos
 * valores; la interfaz debe mostrarlos como texto plano (nunca `innerHTML`).
 * También ejercita una tasa de error muy alta para forzar la ruta de burn
 * rate crítico sin romper el cálculo.
 */
export const adversarialFixture: EngineInputEnvelope = {
  schemaVersion: '1.0.0',
  scenarioId: 'adversarial',
  payload: {
    sli: {
      name: '<script>alert(document.cookie)</script> disponibilidad',
      unit: 'ratio',
      goodEvents: 700_000,
      totalEvents: 1_000_000,
    },
    slo: { target: 0.995 },
    window: { type: 'rolling', durationDays: 7 },
    burnEvents: [
      {
        label: '"><img src=x onerror=alert(1)>',
        startHour: 0,
        durationHours: 3,
        errorRateDuringEvent: 0.9,
      },
      {
        label: 'javascript:alert(1)//incidente prolongado',
        startHour: 10,
        durationHours: 5,
        errorRateDuringEvent: 0.4,
      },
    ],
    compareTargets: [0.9],
  },
  options: { deterministic: true },
};

/**
 * Fixture inválido: objetivo del 100% (imposible de sostener) y ventana fuera
 * de rango. Debe producir `status: 'failed'` con hallazgos `INPUT_INVALID`
 * que señalen ambos campos, nunca una excepción sin tipar.
 */
export const invalidInputFixture: unknown = {
  schemaVersion: '1.0.0',
  scenarioId: 'invalid-input',
  payload: {
    sli: {
      name: 'Latencia del checkout',
      unit: 'ratio',
      goodEvents: 100,
      totalEvents: 100,
    },
    slo: { target: 1 },
    window: { type: 'rolling', durationDays: 400 },
    burnEvents: [],
    compareTargets: [],
  },
  options: { deterministic: true },
};

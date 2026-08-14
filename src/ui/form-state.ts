/**
 * Estado editable del formulario. Usa porcentajes legibles (0-100) para
 * campos que en el dominio son fracciones estrictas (0-1); la conversión
 * ocurre al construir el sobre que se envía al motor.
 */
export interface BurnEventFormState {
  key: string;
  label: string;
  startHour: number;
  durationHours: number;
  errorRatePercent: number;
}

export interface FormState {
  scenarioId: string;
  sliName: string;
  goodEvents: number;
  totalEvents: number;
  targetPercent: number;
  windowType: 'rolling' | 'calendar';
  durationDays: number;
  burnEvents: BurnEventFormState[];
  compareTargetsPercent: number[];
}

let keySeed = 0;
export function nextKey(): string {
  keySeed += 1;
  return `be_${keySeed}`;
}

export function formStateFromEnvelope(envelope: unknown, scenarioId: string): FormState {
  const raw = envelope as {
    payload?: {
      sli?: { name?: unknown; goodEvents?: unknown; totalEvents?: unknown };
      slo?: { target?: unknown };
      window?: { type?: unknown; durationDays?: unknown };
      burnEvents?: unknown;
      compareTargets?: unknown;
    };
  };
  const payload = raw.payload ?? {};
  const sli = payload.sli ?? {};
  const slo = payload.slo ?? {};
  const win = payload.window ?? {};

  const burnEvents = Array.isArray(payload.burnEvents)
    ? (payload.burnEvents as Array<Record<string, unknown>>).map((event) => ({
        key: nextKey(),
        label: typeof event.label === 'string' ? event.label : 'Incidente',
        startHour: typeof event.startHour === 'number' ? event.startHour : 0,
        durationHours: typeof event.durationHours === 'number' ? event.durationHours : 1,
        errorRatePercent:
          typeof event.errorRateDuringEvent === 'number' ? event.errorRateDuringEvent * 100 : 1,
      }))
    : [];

  const compareTargetsPercent = Array.isArray(payload.compareTargets)
    ? (payload.compareTargets as unknown[])
        .filter((v): v is number => typeof v === 'number')
        .map((v) => v * 100)
    : [];

  return {
    scenarioId,
    sliName: typeof sli.name === 'string' ? sli.name : 'Mi indicador',
    goodEvents: typeof sli.goodEvents === 'number' ? sli.goodEvents : 990,
    totalEvents: typeof sli.totalEvents === 'number' ? sli.totalEvents : 1000,
    targetPercent: typeof slo.target === 'number' ? slo.target * 100 : 99.9,
    windowType: win.type === 'calendar' ? 'calendar' : 'rolling',
    durationDays: typeof win.durationDays === 'number' ? win.durationDays : 30,
    burnEvents,
    compareTargetsPercent,
  };
}

export function buildEnvelopeFromForm(form: FormState): unknown {
  return {
    schemaVersion: '1.0.0',
    scenarioId: form.scenarioId,
    payload: {
      sli: {
        name: form.sliName,
        unit: 'ratio',
        goodEvents: form.goodEvents,
        totalEvents: form.totalEvents,
      },
      slo: { target: form.targetPercent / 100 },
      window: { type: form.windowType, durationDays: form.durationDays },
      burnEvents: form.burnEvents.map((event) => ({
        label: event.label,
        startHour: event.startHour,
        durationHours: event.durationHours,
        errorRateDuringEvent: event.errorRatePercent / 100,
      })),
      compareTargets: form.compareTargetsPercent.map((p) => p / 100),
    },
    options: { deterministic: true },
  };
}

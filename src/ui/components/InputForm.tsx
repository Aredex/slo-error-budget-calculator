import type { FormState } from '../form-state';
import { nextKey } from '../form-state';

interface Props {
  form: FormState;
  onChange: (next: FormState) => void;
  disabled: boolean;
}

export function InputForm({ form, onChange, disabled }: Props) {
  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    onChange({ ...form, [key]: value });
  }

  function updateBurnEvent(key: string, patch: Partial<FormState['burnEvents'][number]>) {
    onChange({
      ...form,
      burnEvents: form.burnEvents.map((event) => (event.key === key ? { ...event, ...patch } : event)),
    });
  }

  function addBurnEvent() {
    onChange({
      ...form,
      burnEvents: [
        ...form.burnEvents,
        { key: nextKey(), label: 'Nuevo incidente', startHour: 0, durationHours: 1, errorRatePercent: 1 },
      ],
    });
  }

  function removeBurnEvent(key: string) {
    onChange({ ...form, burnEvents: form.burnEvents.filter((event) => event.key !== key) });
  }

  function updateCompareTarget(index: number, value: number) {
    const next = [...form.compareTargetsPercent];
    next[index] = value;
    onChange({ ...form, compareTargetsPercent: next });
  }

  function addCompareTarget() {
    onChange({ ...form, compareTargetsPercent: [...form.compareTargetsPercent, 99] });
  }

  function removeCompareTarget(index: number) {
    onChange({
      ...form,
      compareTargetsPercent: form.compareTargetsPercent.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="input-form">
      <div className="input-form__grid">
        <label className="field">
          <span>Nombre del indicador (SLI)</span>
          <input
            type="text"
            value={form.sliName}
            disabled={disabled}
            onChange={(e) => update('sliName', e.target.value)}
            maxLength={120}
          />
        </label>

        <label className="field">
          <span>Eventos buenos</span>
          <input
            type="number"
            value={form.goodEvents}
            disabled={disabled}
            min={0}
            onChange={(e) => update('goodEvents', Number(e.target.value))}
          />
        </label>

        <label className="field">
          <span>Eventos totales</span>
          <input
            type="number"
            value={form.totalEvents}
            disabled={disabled}
            min={1}
            onChange={(e) => update('totalEvents', Number(e.target.value))}
          />
        </label>

        <label className="field">
          <span>Objetivo (SLO) en %</span>
          <input
            type="number"
            step="0.001"
            value={form.targetPercent}
            disabled={disabled}
            onChange={(e) => update('targetPercent', Number(e.target.value))}
            aria-describedby="slo-target-help"
          />
          <small id="slo-target-help">Un objetivo de 100% no es válido: no deja presupuesto de error.</small>
        </label>

        <label className="field">
          <span>Tipo de ventana</span>
          <select
            value={form.windowType}
            disabled={disabled}
            onChange={(e) => update('windowType', e.target.value as FormState['windowType'])}
          >
            <option value="rolling">Móvil (rolling)</option>
            <option value="calendar">Calendario</option>
          </select>
        </label>

        <label className="field">
          <span>Duración de la ventana (días)</span>
          <input
            type="number"
            value={form.durationDays}
            disabled={disabled}
            min={1}
            max={365}
            onChange={(e) => update('durationDays', Number(e.target.value))}
          />
        </label>
      </div>

      <fieldset className="input-form__events">
        <legend>Eventos de incidente (simulación de burn rate)</legend>
        {form.burnEvents.length === 0 && <p className="muted">Sin eventos: el presupuesto se consume solo por el SLI base.</p>}
        <ul className="event-list">
          {form.burnEvents.map((event, index) => (
            <li key={event.key} className="event-list__item">
              <label className="field field--compact">
                <span>Etiqueta {index + 1}</span>
                <input
                  type="text"
                  value={event.label}
                  disabled={disabled}
                  maxLength={80}
                  onChange={(e) => updateBurnEvent(event.key, { label: e.target.value })}
                />
              </label>
              <label className="field field--compact">
                <span>Inicio (h)</span>
                <input
                  type="number"
                  value={event.startHour}
                  disabled={disabled}
                  min={0}
                  onChange={(e) => updateBurnEvent(event.key, { startHour: Number(e.target.value) })}
                />
              </label>
              <label className="field field--compact">
                <span>Duración (h)</span>
                <input
                  type="number"
                  value={event.durationHours}
                  disabled={disabled}
                  min={0.1}
                  step="0.1"
                  onChange={(e) => updateBurnEvent(event.key, { durationHours: Number(e.target.value) })}
                />
              </label>
              <label className="field field--compact">
                <span>Tasa de error (%)</span>
                <input
                  type="number"
                  value={event.errorRatePercent}
                  disabled={disabled}
                  min={0}
                  max={100}
                  step="0.01"
                  onChange={(e) => updateBurnEvent(event.key, { errorRatePercent: Number(e.target.value) })}
                />
              </label>
              <button
                type="button"
                className="button button--ghost"
                disabled={disabled}
                onClick={() => removeBurnEvent(event.key)}
              >
                Quitar<span className="visually-hidden"> evento {index + 1}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="button button--secondary" disabled={disabled} onClick={addBurnEvent}>
          Añadir evento
        </button>
      </fieldset>

      <fieldset className="input-form__compare">
        <legend>Objetivos a comparar (%)</legend>
        {form.compareTargetsPercent.length === 0 && <p className="muted">Sin objetivos adicionales: solo se calculará el objetivo base.</p>}
        <ul className="compare-list">
          {form.compareTargetsPercent.map((value, index) => (
            <li key={index} className="compare-list__item">
              <label className="field field--compact">
                <span>Objetivo {index + 1} (%)</span>
                <input
                  type="number"
                  step="0.001"
                  value={value}
                  disabled={disabled}
                  onChange={(e) => updateCompareTarget(index, Number(e.target.value))}
                />
              </label>
              <button
                type="button"
                className="button button--ghost"
                disabled={disabled}
                onClick={() => removeCompareTarget(index)}
              >
                Quitar<span className="visually-hidden"> objetivo {index + 1}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="button button--secondary" disabled={disabled} onClick={addCompareTarget}>
          Añadir objetivo
        </button>
      </fieldset>
    </div>
  );
}

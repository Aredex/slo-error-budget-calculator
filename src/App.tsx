import { useMemo, useRef, useState } from 'react';
import './ui/styles/app.css';
import { getFixtureById } from './fixtures';
import { HowItWorks } from './ui/components/HowItWorks';
import { InputForm } from './ui/components/InputForm';
import { PrivacyNote } from './ui/components/PrivacyNote';
import { ResultPanel } from './ui/components/ResultPanel';
import { ScenarioSelector } from './ui/components/ScenarioSelector';
import { buildEnvelopeFromForm, formStateFromEnvelope } from './ui/form-state';
import { useEngineRun } from './ui/hooks/useEngineRun';

const REPO_URL = 'https://github.com/Aredex/slo-error-budget-calculator';

function App() {
  const initialFixture = getFixtureById('happy-path')!;
  const [scenarioId, setScenarioId] = useState(initialFixture.id);
  const [form, setForm] = useState(() => formStateFromEnvelope(initialFixture.value, initialFixture.id));
  const { phase, result, run, cancel, reset } = useEngineRun();
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const envelope = useMemo(() => buildEnvelopeFromForm(form), [form]);

  function handleSelectScenario(id: string) {
    const fixture = getFixtureById(id);
    if (!fixture) return;
    setScenarioId(id);
    setForm(formStateFromEnvelope(fixture.value, id));
    reset();
  }

  function handleRun() {
    run(envelope);
    window.setTimeout(() => resultHeadingRef.current?.focus(), 0);
  }

  function handleReset() {
    const fixture = getFixtureById(scenarioId);
    if (fixture) {
      setForm(formStateFromEnvelope(fixture.value, scenarioId));
    }
    reset();
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>

      <header className="app-header">
        <div className="app-header__row">
          <h1>SLO/Error Budget Calculator</h1>
          <PrivacyNote />
        </div>
        <p className="app-header__tagline">Haz visible lo que normalmente falla en silencio.</p>
        <p className="app-header__help">
          Usa el ejemplo incluido o carga datos propios. El modo local no los envía a ningún servidor.
        </p>
      </header>

      <main id="main-content" className="app-main">
        <section className="workbench" aria-labelledby="workbench-heading">
          <h2 id="workbench-heading">Entrada y escenario</h2>
          <ScenarioSelector selectedId={scenarioId} onSelect={handleSelectScenario} disabled={phase === 'processing'} />
          <InputForm form={form} onChange={setForm} disabled={phase === 'processing'} />

          <div className="workbench__actions">
            <button type="button" className="button button--primary" onClick={handleRun} disabled={phase === 'processing'}>
              Ejecutar escenario
            </button>
            {phase === 'processing' && (
              <button type="button" className="button button--secondary" onClick={cancel}>
                Cancelar
              </button>
            )}
            {phase === 'done' && (
              <button type="button" className="button button--ghost" onClick={handleReset}>
                Borrar datos de esta sesión
              </button>
            )}
            {phase === 'processing' && (
              <span role="status" className="workbench__status">
                Procesando…
              </span>
            )}
          </div>
        </section>

        <section className="result" aria-labelledby="result-heading">
          <h2 id="result-heading" ref={resultHeadingRef} tabIndex={-1}>
            Resultado
          </h2>
          {phase === 'idle' && (
            <p className="muted">Aún no hay resultado. Ejecuta el fixture para ver cada decisión.</p>
          )}
          {phase === 'processing' && <p aria-hidden="true">Calculando…</p>}
          {phase === 'done' && result && <ResultPanel result={result} />}
        </section>

        <HowItWorks />

        <section className="case-study" aria-labelledby="case-study-heading">
          <h2 id="case-study-heading">Caso de estudio</h2>
          <p>
            Decisiones, pruebas y arquitectura de este proyecto están documentadas en el repositorio
            público, incluyendo los fixtures adversariales y el historial de commits.
          </p>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            Ver repositorio en GitHub
          </a>
        </section>
      </main>

      <footer className="app-footer">
        <p>SLO/Error Budget Calculator · cálculo 100% local · sin cuentas ni datos reales</p>
      </footer>
    </div>
  );
}

export default App;

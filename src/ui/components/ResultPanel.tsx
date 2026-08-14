import type { EngineRunResult } from '../../domain/types';
import { AssumptionsList } from './AssumptionsList';
import { BurnChart } from './BurnChart';
import { ComparisonTable } from './ComparisonTable';
import { ExportControls } from './ExportControls';
import { FindingsList } from './FindingsList';

const STATUS_LABEL: Record<string, string> = {
  completed: 'Completado',
  partial: 'Completado (modo determinista)',
  failed: 'Entrada inválida',
  cancelled: 'Cancelado',
};

export function ResultPanel({ result }: { result: EngineRunResult }) {
  const { output, detail } = result;

  return (
    <div className="result-panel" aria-live="polite">
      <div className={`result-panel__status result-panel__status--${output.status}`}>
        <span className="result-panel__badge">{STATUS_LABEL[output.status] ?? output.status}</span>
        <span className="result-panel__run-id">Ejecución {output.runId}</span>
      </div>

      <p className="result-panel__summary">{output.summary}</p>

      <section aria-labelledby="findings-heading">
        <h3 id="findings-heading">Decisiones y hallazgos</h3>
        <FindingsList findings={output.findings} />
      </section>

      {detail && (
        <>
          <section aria-labelledby="budget-heading">
            <h3 id="budget-heading">Presupuesto de error</h3>
            <dl className="budget-summary">
              <div>
                <dt>Confianza del cálculo</dt>
                <dd>
                  <span className={`confidence-badge confidence-badge--${detail.budget.confidence}`}>
                    {detail.budget.confidence}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Presupuesto total</dt>
                <dd>{detail.budget.totalBudgetMinutes.toFixed(1)} minutos</dd>
              </div>
              <div>
                <dt>Consumido</dt>
                <dd>{detail.budget.consumedMinutes.toFixed(1)} minutos</dd>
              </div>
              <div>
                <dt>Restante</dt>
                <dd>
                  {detail.budget.remainingMinutes.toFixed(1)} minutos ({(detail.budget.remainingRatio * 100).toFixed(1)}%)
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="burn-heading">
            <h3 id="burn-heading">Simulación de burn rate</h3>
            <BurnChart burn={detail.burn} totalBudgetMinutes={detail.budget.totalBudgetMinutes} />
          </section>

          <section aria-labelledby="compare-heading">
            <h3 id="compare-heading">Comparación de objetivos</h3>
            <ComparisonTable rows={detail.comparisons} />
          </section>

          <section aria-labelledby="assumptions-heading">
            <h3 id="assumptions-heading">Supuestos y confianza</h3>
            <AssumptionsList assumptions={detail.assumptions} />
          </section>

          <section aria-labelledby="export-heading">
            <h3 id="export-heading">Exportar evidencia</h3>
            <ExportControls result={result} />
          </section>
        </>
      )}
    </div>
  );
}

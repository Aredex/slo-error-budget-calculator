import type { BurnSimulationResult } from '../../domain/types';

interface Props {
  burn: BurnSimulationResult;
  totalBudgetMinutes: number;
}

/**
 * La gráfica SVG es decorativa (`aria-hidden`): toda la información que
 * transmite está también en la tabla que la acompaña, que es la fuente de
 * verdad accesible (ver 04-sistema-visual-y-accesibilidad.md: "Gráficas y
 * diffs incluyen tabla o resumen textual equivalente").
 */
export function BurnChart({ burn, totalBudgetMinutes }: Props) {
  if (burn.timeline.length === 0) {
    return <p className="muted">No se simularon eventos de incidente en este escenario.</p>;
  }

  const maxRatio = Math.max(1, ...burn.timeline.map((p) => p.cumulativeConsumedRatio));
  const chartHeight = 160;
  const barWidth = 100 / burn.timeline.length;

  return (
    <div className="burn-chart">
      <svg
        className="burn-chart__svg"
        viewBox={`0 0 100 ${chartHeight}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        role="presentation"
      >
        <line x1="0" y1={chartHeight - (chartHeight * 1) / maxRatio} x2="100" y2={chartHeight - (chartHeight * 1) / maxRatio} className="burn-chart__threshold" />
        {burn.timeline.map((point, index) => {
          const barHeight = Math.min(chartHeight, (point.cumulativeConsumedRatio / maxRatio) * chartHeight);
          return (
            <rect
              key={index}
              x={index * barWidth + barWidth * 0.15}
              y={chartHeight - barHeight}
              width={barWidth * 0.7}
              height={barHeight}
              className={`burn-chart__bar burn-chart__bar--${point.severity}`}
            />
          );
        })}
      </svg>

      <table className="burn-table">
        <caption className="visually-hidden">
          Presupuesto acumulado consumido por cada evento de incidente, como alternativa textual a la gráfica.
        </caption>
        <thead>
          <tr>
            <th scope="col">Evento</th>
            <th scope="col">Inicio (h)</th>
            <th scope="col">Duración (h)</th>
            <th scope="col">Burn rate</th>
            <th scope="col">Presupuesto acumulado consumido</th>
            <th scope="col">Severidad</th>
          </tr>
        </thead>
        <tbody>
          {burn.timeline.map((point, index) => (
            <tr key={index}>
              <td>{point.label}</td>
              <td>{point.startHour.toFixed(1)}</td>
              <td>{(point.endHour - point.startHour).toFixed(1)}</td>
              <td>{point.burnRate.toFixed(2)}x</td>
              <td>
                {point.cumulativeConsumedMinutes.toFixed(1)} min de {totalBudgetMinutes.toFixed(1)} (
                {(point.cumulativeConsumedRatio * 100).toFixed(1)}%)
              </td>
              <td>
                <span className={`severity-badge severity-badge--${point.severity}`}>{point.severity}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="burn-chart__summary">
        Burn rate actual: <strong>{burn.currentBurnRate.toFixed(2)}x</strong>.{' '}
        {burn.projectedExhaustionDays === null
          ? 'A este ritmo, el presupuesto no se proyecta agotar dentro de la ventana.'
          : burn.projectedExhaustionDays <= 0
            ? 'El presupuesto ya está agotado.'
            : `Proyección de agotamiento: ${burn.projectedExhaustionDays.toFixed(1)} día(s).`}
      </p>
    </div>
  );
}

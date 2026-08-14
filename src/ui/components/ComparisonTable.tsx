import type { ComparisonRow } from '../../domain/types';

export function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  if (rows.length <= 1) {
    return <p className="muted">Añade objetivos de comparación para ver esta tabla.</p>;
  }

  return (
    <table className="comparison-table">
      <caption className="visually-hidden">Comparación de presupuesto de error entre objetivos alternativos.</caption>
      <thead>
        <tr>
          <th scope="col">Objetivo</th>
          <th scope="col">Presupuesto total</th>
          <th scope="col">Restante</th>
          <th scope="col">Estado</th>
          <th scope="col">Agotamiento proyectado</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.target} aria-current={row.isBaseline ? 'true' : undefined}>
            <td>
              {(row.target * 100).toFixed(3)}%{row.isBaseline ? ' (base)' : ''}
            </td>
            <td>{row.budget.totalBudgetMinutes.toFixed(1)} min</td>
            <td>{(row.budget.remainingRatio * 100).toFixed(1)}%</td>
            <td>
              <span className={`severity-badge severity-badge--${statusSeverity(row.budget.status)}`}>
                {row.budget.status}
              </span>
            </td>
            <td>
              {row.projectedExhaustionDays === null
                ? 'sin proyección'
                : `${row.projectedExhaustionDays.toFixed(1)} día(s)`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function statusSeverity(status: 'healthy' | 'at-risk' | 'exhausted') {
  if (status === 'exhausted') return 'critical';
  if (status === 'at-risk') return 'warning';
  return 'info';
}

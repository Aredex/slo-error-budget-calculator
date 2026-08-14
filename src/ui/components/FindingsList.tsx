import type { Finding } from '../../domain/types';

const SEVERITY_LABEL: Record<Finding['severity'], string> = {
  info: 'Información',
  warning: 'Advertencia',
  error: 'Error',
  critical: 'Crítico',
};

export function FindingsList({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return <p className="muted">Aún no hay hallazgos. Ejecuta el fixture para ver cada decisión.</p>;
  }

  return (
    <ol className="findings-list">
      {findings.map((finding, index) => (
        <li key={`${finding.ruleId}-${index}`} className={`findings-list__item findings-list__item--${finding.severity}`}>
          <div className="findings-list__header">
            <span className={`severity-badge severity-badge--${finding.severity}`}>
              {SEVERITY_LABEL[finding.severity]}
            </span>
            <span className="findings-list__rule">{finding.ruleId}</span>
          </div>
          <p>{finding.message}</p>
          {finding.suggestion && <p className="findings-list__suggestion">Sugerencia: {finding.suggestion}</p>}
        </li>
      ))}
    </ol>
  );
}

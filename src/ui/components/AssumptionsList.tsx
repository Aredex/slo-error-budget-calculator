import type { Assumption } from '../../domain/types';

const CONFIDENCE_LABEL: Record<Assumption['confidence'], string> = {
  high: 'Confianza alta',
  medium: 'Confianza media',
  low: 'Confianza baja',
};

export function AssumptionsList({ assumptions }: { assumptions: Assumption[] }) {
  return (
    <ul className="assumptions-list">
      {assumptions.map((assumption) => (
        <li key={assumption.id} className="assumptions-list__item">
          <span className={`confidence-badge confidence-badge--${assumption.confidence}`}>
            {CONFIDENCE_LABEL[assumption.confidence]}
          </span>
          <p>{assumption.text}</p>
        </li>
      ))}
    </ul>
  );
}

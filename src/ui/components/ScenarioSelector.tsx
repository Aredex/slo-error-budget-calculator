import { FIXTURES } from '../../fixtures';

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  disabled: boolean;
}

export function ScenarioSelector({ selectedId, onSelect, disabled }: Props) {
  return (
    <fieldset className="scenario-selector">
      <legend>Escenario de partida</legend>
      <div className="scenario-selector__list">
        {FIXTURES.map((fixture) => (
          <label key={fixture.id} className="scenario-selector__item">
            <input
              type="radio"
              name="scenario"
              value={fixture.id}
              checked={selectedId === fixture.id}
              disabled={disabled}
              onChange={() => onSelect(fixture.id)}
              aria-label={`${fixture.label}. ${fixture.description}`}
            />
            <span aria-hidden="true">
              <strong>{fixture.label}</strong>
              <small>{fixture.description}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

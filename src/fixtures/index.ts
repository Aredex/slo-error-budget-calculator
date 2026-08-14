import { adversarialFixture } from './adversarial';
import { boundaryFixture } from './boundary';
import { dependencyDownFixture } from './dependency-down';
import { happyPathFixture } from './happy-path';
import { invalidInputFixture } from './invalid-input';

export { adversarialFixture, boundaryFixture, dependencyDownFixture, happyPathFixture, invalidInputFixture };

export interface FixtureDescriptor {
  id: string;
  label: string;
  description: string;
  value: unknown;
}

export const FIXTURES: FixtureDescriptor[] = [
  {
    id: 'happy-path',
    label: 'Ejemplo estándar',
    description: 'API de checkout con objetivo del 99.9% y un incidente moderado.',
    value: happyPathFixture,
  },
  {
    id: 'boundary',
    label: 'Caso límite',
    description: 'Ventana máxima (365 días), objetivo casi perfecto y 10 comparaciones.',
    value: boundaryFixture,
  },
  {
    id: 'adversarial',
    label: 'Caso adversarial',
    description: 'Contenido hostil en campos de texto y burn rate crítico.',
    value: adversarialFixture,
  },
  {
    id: 'dependency-down',
    label: 'Adaptador no disponible',
    description: 'Demuestra el fallback a modo determinista local.',
    value: dependencyDownFixture,
  },
  {
    id: 'invalid-input',
    label: 'Entrada inválida',
    description: 'Objetivo del 100% y ventana fuera de rango: debe fallar con explicación clara.',
    value: invalidInputFixture,
  },
];

export function getFixtureById(id: string): FixtureDescriptor | undefined {
  return FIXTURES.find((f) => f.id === id);
}

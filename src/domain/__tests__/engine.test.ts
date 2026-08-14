import { describe, expect, it } from 'vitest';
import {
  adversarialFixture,
  boundaryFixture,
  dependencyDownFixture,
  happyPathFixture,
  invalidInputFixture,
} from '../../fixtures';
import { runScenario } from '../engine';

describe('runScenario', () => {
  it('P18-R1/R2: happy-path produce un resultado completado con presupuesto y burn simulado', () => {
    const { output, detail } = runScenario(happyPathFixture, { runIdSeed: 'test-happy' });
    expect(output.status).toBe('completed');
    expect(output.schemaVersion).toBe('1.0.0');
    expect(output.evidence.scenarioId).toBe('happy-path');
    expect(output.findings.length).toBeGreaterThan(0);
    expect(detail).not.toBeNull();
    expect(detail!.budget.status).not.toBe('exhausted');
    expect(detail!.burn.timeline).toHaveLength(1);
    // Ningún hallazgo crítico en el escenario feliz.
    expect(output.findings.some((f) => f.severity === 'critical')).toBe(false);
  });

  it('entrada inválida produce status "failed" con hallazgos tipados, no una excepción', () => {
    const { output, detail } = runScenario(invalidInputFixture, { runIdSeed: 'test-invalid' });
    expect(output.status).toBe('failed');
    expect(detail).toBeNull();
    expect(output.findings.every((f) => f.severity === 'error')).toBe(true);
    expect(output.findings.some((f) => f.message.includes('100%'))).toBe(true);
  });

  it('P18-R3: boundary compara múltiples objetivos en el límite permitido', () => {
    const { output, detail } = runScenario(boundaryFixture, { runIdSeed: 'test-boundary' });
    expect(output.status).toBe('completed');
    expect(detail!.comparisons.length).toBeGreaterThan(1);
    expect(output.findings.some((f) => f.ruleId === 'comparison-available')).toBe(true);
  });

  it('el escenario adversarial no ejecuta contenido hostil y clasifica el burn rate crítico', () => {
    const { output, detail } = runScenario(adversarialFixture, { runIdSeed: 'test-adversarial' });
    expect(output.status).toBe('completed');
    // El contenido hostil viaja como texto plano dentro del mensaje del hallazgo.
    expect(output.summary).not.toContain('<script>');
    expect(detail!.burn.worstSeverity).toBe('critical');
    expect(output.findings.some((f) => f.severity === 'critical')).toBe(true);
  });

  it('dependency-down cae a modo determinista local y lo declara explícitamente', () => {
    const { output } = runScenario(dependencyDownFixture, { runIdSeed: 'test-dep-down' });
    expect(output.status).toBe('partial');
    expect(output.findings[0].ruleId).toBe('DEPENDENCY_UNAVAILABLE');
  });

  it('P18-R4: cada ejecución exitosa incluye supuestos explicados como hallazgos informativos', () => {
    const { output } = runScenario(happyPathFixture, { runIdSeed: 'test-explain' });
    const assumptionFindings = output.findings.filter((f) => f.ruleId.startsWith('assumption:'));
    expect(assumptionFindings.length).toBeGreaterThanOrEqual(4);
    expect(assumptionFindings.every((f) => f.message.includes('confianza'))).toBe(true);
  });

  it('trunca los hallazgos al máximo documentado sin lanzar error', () => {
    const massiveFixture = JSON.parse(JSON.stringify(boundaryFixture));
    massiveFixture.payload.burnEvents = Array.from({ length: 50 }, (_, i) => ({
      label: `evento-${i}`,
      startHour: i,
      durationHours: 1,
      errorRateDuringEvent: 0.5,
    }));
    const { output } = runScenario(massiveFixture, { runIdSeed: 'test-truncate' });
    expect(output.findings.length).toBeLessThanOrEqual(1000);
  });

  it('es determinista dado el mismo runIdSeed', () => {
    const a = runScenario(happyPathFixture, { runIdSeed: 'same' });
    const b = runScenario(happyPathFixture, { runIdSeed: 'same' });
    expect(a.output).toEqual(b.output);
  });

  it('nunca marca el resultado como saludable si el objetivo enviado es 100% (defensa en profundidad)', () => {
    const forcedInvalid = JSON.parse(JSON.stringify(happyPathFixture));
    forcedInvalid.payload.slo.target = 1;
    const { output } = runScenario(forcedInvalid, { runIdSeed: 'test-100' });
    expect(output.status).toBe('failed');
  });
});

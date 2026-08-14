import { describe, expect, it } from 'vitest';
import { happyPathFixture } from '../../fixtures/happy-path';
import { buildJsonExport, buildMarkdownExport, exportPolicy } from '../export';
import { runScenario } from '../engine';

describe('exportPolicy', () => {
  it('declara que el payload de entrada se redacta por defecto', () => {
    const policy = exportPolicy();
    expect(policy.redactedInputFields).toContain('payload');
  });
});

describe('buildJsonExport', () => {
  it('nunca incluye el payload de entrada original', () => {
    const result = runScenario(happyPathFixture, { runIdSeed: 'export-test' });
    const json = buildJsonExport(result);
    const parsed = JSON.parse(json);
    expect(parsed).not.toHaveProperty('payload');
    expect(json).not.toContain('goodEvents');
  });

  it('es JSON válido que refleja el runId y status', () => {
    const result = runScenario(happyPathFixture, { runIdSeed: 'export-test-2' });
    const parsed = JSON.parse(buildJsonExport(result));
    expect(parsed.runId).toBe(result.output.runId);
    expect(parsed.status).toBe(result.output.status);
  });
});

describe('buildMarkdownExport', () => {
  it('incluye la tabla de hallazgos y una nota de exclusión de payload', () => {
    const result = runScenario(happyPathFixture, { runIdSeed: 'export-test-3' });
    const markdown = buildMarkdownExport(result);
    expect(markdown).toContain('| Regla | Severidad | Mensaje |');
    expect(markdown).toContain('no incluye el payload de entrada original');
    expect(markdown).not.toContain('goodEvents');
  });
});

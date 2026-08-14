/**
 * `exportPolicy` + generadores de exportación.
 *
 * La política declara qué se excluye de cualquier exportación por defecto
 * (08-seguridad-privacidad.md: "la exportación redacta campos configurados").
 * Como la app es 100% cliente, no hay respuesta HTTP real con
 * `Content-Disposition`; el equivalente en un documento estático es el
 * atributo `download` del enlace generado a partir de un Blob, que fuerza al
 * navegador a descargar el archivo en vez de navegarlo. Se documenta aquí
 * para que la decisión quede trazable.
 */
import type { EngineRunResult } from './types';

export interface ExportPolicy {
  /** Campos del payload de entrada que nunca se incluyen en la exportación. */
  redactedInputFields: string[];
  /** Mecanismo usado para forzar descarga en vez de navegación in-place. */
  downloadMechanism: 'anchor-download-attribute';
  notes: string;
}

export function exportPolicy(): ExportPolicy {
  return {
    redactedInputFields: ['payload'],
    downloadMechanism: 'anchor-download-attribute',
    notes:
      'La exportación incluye únicamente el resultado agregado (findings, resumen, evidencia) y nunca el payload de entrada original, para evitar filtrar datos que el visitante pudo haber editado con información propia.',
  };
}

export function buildJsonExport(result: EngineRunResult): string {
  return JSON.stringify(result.output, null, 2);
}

export function buildMarkdownExport(result: EngineRunResult): string {
  const { output, detail } = result;
  const lines: string[] = [];
  lines.push(`# Informe de ejecución — ${output.runId}`);
  lines.push('');
  lines.push(`- **Estado:** ${output.status}`);
  lines.push(`- **Escenario:** ${output.evidence.scenarioId}`);
  lines.push(`- **Versión de reglas:** ${output.evidence.rulesVersion}`);
  lines.push('');
  lines.push('## Resumen');
  lines.push('');
  lines.push(output.summary);
  lines.push('');

  if (detail) {
    lines.push('## Presupuesto de error');
    lines.push('');
    lines.push(`- Confianza: ${detail.budget.confidence}`);
    lines.push(`- Estado: ${detail.budget.status}`);
    lines.push(`- Presupuesto restante: ${(detail.budget.remainingRatio * 100).toFixed(2)}%`);
    lines.push(`- Minutos restantes: ${detail.budget.remainingMinutes.toFixed(1)} de ${detail.budget.totalBudgetMinutes.toFixed(1)}`);
    lines.push('');
  }

  lines.push('## Decisiones y hallazgos');
  lines.push('');
  lines.push('| Regla | Severidad | Mensaje |');
  lines.push('|---|---|---|');
  for (const finding of output.findings) {
    lines.push(`| ${finding.ruleId} | ${finding.severity} | ${finding.message.replace(/\|/g, '\\|')} |`);
  }
  lines.push('');
  lines.push('_Este informe no incluye el payload de entrada original (ver política de exportación)._');

  return lines.join('\n');
}

export function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

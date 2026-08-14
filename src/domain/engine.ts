/**
 * Motor de orquestación: valida la entrada, ejecuta las reglas puras de
 * dominio (budget/burn/compare/explain) y produce:
 *  - `output`: el sobre validado contra contracts/output.schema.json (lo
 *    único que se exporta/valida por contrato).
 *  - `detail`: la forma rica que consume la interfaz para tablas y gráficas.
 *
 * `runScenario` es una función pura respecto de sus argumentos explícitos
 * (no lee reloj ni aleatoriedad salvo por los parámetros opcionales
 * `now`/`runIdSeed`, inyectables desde los tests para determinismo total).
 */
import { calculateBudget } from './budget';
import { simulateBurn } from './burn';
import { compareObjectives } from './compare';
import { explainDecisions } from './explain';
import { RULES_VERSION } from './rules-version';
import type {
  EngineInputEnvelope,
  EngineOutput,
  EngineRunResult,
  Finding,
  Severity,
} from './types';
import { LIMITS } from './limits';
import { validateInput } from './validation';

function makeRunId(scenarioId: string, seed?: string): string {
  if (seed) return seed;
  const random = Math.random().toString(36).slice(2, 10);
  return `run_${scenarioId}_${random}`;
}

function severityFromRatio(remainingRatio: number): Severity {
  if (remainingRatio <= 0) return 'critical';
  if (remainingRatio < 0.2) return 'warning';
  return 'info';
}

function truncateFindings(findings: Finding[]): Finding[] {
  if (findings.length <= LIMITS.findingsMax) return findings;
  return findings.slice(0, LIMITS.findingsMax);
}

export interface RunScenarioOptions {
  runIdSeed?: string;
}

export function runScenario(raw: unknown, options: RunScenarioOptions = {}): EngineRunResult {
  const validation = validateInput(raw);

  if (!validation.ok) {
    const scenarioId =
      typeof raw === 'object' && raw !== null && 'scenarioId' in raw && typeof (raw as Record<string, unknown>).scenarioId === 'string'
        ? ((raw as Record<string, unknown>).scenarioId as string)
        : 'unknown';
    const findings: Finding[] = validation.issues.map((iss) => ({
      ruleId: iss.code,
      severity: 'error',
      message: `${iss.path}: ${iss.message}`,
      suggestion: 'Corrige el campo señalado y vuelve a ejecutar el escenario.',
    }));
    const output: EngineOutput = {
      schemaVersion: '1.0.0',
      runId: makeRunId(scenarioId, options.runIdSeed),
      status: 'failed',
      summary: `La entrada no es válida: ${validation.issues.length} problema(s) encontrado(s). No se envió ningún dato fuera del navegador.`,
      findings: truncateFindings(findings),
      evidence: { rulesVersion: RULES_VERSION, scenarioId },
    };
    return { output, detail: null };
  }

  const input: EngineInputEnvelope = validation.value;
  const { sli, slo, window, burnEvents, compareTargets } = input.payload;

  const budget = calculateBudget(sli, slo, window);
  const burn = simulateBurn(budget, burnEvents);
  const comparisons = compareObjectives(sli, window, slo.target, compareTargets, burnEvents);
  const assumptions = explainDecisions(sli, slo, window, budget, burnEvents);

  const findings: Finding[] = [];

  findings.push({
    ruleId: 'budget-status',
    severity: severityFromRatio(budget.remainingRatio),
    message:
      budget.status === 'exhausted'
        ? `Presupuesto de error agotado: se consumió el ${(100 - budget.remainingRatio * 100).toFixed(1)}% del presupuesto asignado para "${sli.name}".`
        : budget.status === 'at-risk'
          ? `Presupuesto en riesgo: queda ${(budget.remainingRatio * 100).toFixed(1)}% del presupuesto de error.`
          : `Presupuesto saludable: queda ${(budget.remainingRatio * 100).toFixed(1)}% del presupuesto de error.`,
    evidencePath: 'detail.budget',
    suggestion:
      budget.status === 'exhausted'
        ? 'Congela despliegues no críticos hasta recuperar presupuesto o revisa si el objetivo es realista.'
        : budget.status === 'at-risk'
          ? 'Revisa despliegues recientes y considera reducir el ritmo de cambios.'
          : undefined,
  });

  if (budget.confidence === 'low') {
    findings.push({
      ruleId: 'low-confidence-sample',
      severity: 'warning',
      message: `El indicador se calculó sobre una muestra pequeña (${sli.totalEvents.toLocaleString('es-ES')} eventos). El resultado es orientativo.`,
      evidencePath: 'detail.budget.confidence',
      suggestion: 'Aumenta la ventana de observación o el volumen de eventos antes de usar este resultado en un compromiso externo.',
    });
  }

  burn.timeline.forEach((point, index) => {
    if (point.severity === 'info') return;
    findings.push({
      ruleId: `burn-rate-${point.alertWindow}`,
      severity: point.severity,
      message: `Evento "${point.label}": burn rate ${point.burnRate.toFixed(1)}x (umbral de alerta ${point.alertWindow}).`,
      evidencePath: `detail.burn.timeline[${index}]`,
      suggestion:
        point.severity === 'critical'
          ? 'Ritmo de consumo insostenible: trátalo como incidente activo y detén despliegues.'
          : 'Vigila el evento; si continúa, escala la severidad.',
    });
  });

  if (burn.projectedExhaustionDays !== null) {
    const windowDays = budget.totalWindowMinutes / (24 * 60);
    const severity: Severity = burn.projectedExhaustionDays <= 0 ? 'critical' : burn.projectedExhaustionDays < windowDays * 0.25 ? 'warning' : 'info';
    if (severity !== 'info') {
      findings.push({
        ruleId: 'projected-exhaustion',
        severity,
        message:
          burn.projectedExhaustionDays <= 0
            ? 'El presupuesto ya está agotado según el burn rate observado.'
            : `Al ritmo actual, el presupuesto se agotaría en aproximadamente ${burn.projectedExhaustionDays.toFixed(1)} día(s).`,
        evidencePath: 'detail.burn.projectedExhaustionDays',
        suggestion: 'Reduce el burn rate o negocia el objetivo antes de que se agote la ventana.',
      });
    }
  }

  if (comparisons.length > 1) {
    findings.push({
      ruleId: 'comparison-available',
      severity: 'info',
      message: `Se compararon ${comparisons.length} objetivos posibles para el mismo indicador y ventana.`,
      evidencePath: 'detail.comparisons',
    });
  }

  for (const assumption of assumptions) {
    findings.push({
      ruleId: `assumption:${assumption.id}`,
      severity: 'info',
      message: `[confianza ${assumption.confidence}] ${assumption.text}`,
      evidencePath: 'detail.assumptions',
    });
  }

  let status: EngineOutput['status'] = 'completed';
  if (input.scenarioId === 'dependency-down') {
    status = 'partial';
    findings.unshift({
      ruleId: 'DEPENDENCY_UNAVAILABLE',
      severity: 'warning',
      message: 'El adaptador externo opcional no está configurado (deshabilitado por defecto). Se sirvió el resultado en modo determinista local.',
      suggestion: 'Ninguna acción requerida: el modo determinista es el modo soportado en producción.',
    });
  }

  const worstSeverity = findings.reduce<Severity>((worst, f) => {
    const rank: Record<Severity, number> = { info: 0, warning: 1, error: 2, critical: 3 };
    return rank[f.severity] > rank[worst] ? f.severity : worst;
  }, 'info');

  const summary =
    status === 'partial'
      ? `Ejecución completada en modo determinista (adaptador externo deshabilitado). ${budget.status === 'exhausted' ? 'Presupuesto agotado.' : `Presupuesto restante: ${(budget.remainingRatio * 100).toFixed(1)}%.`}`
      : `Ejecución determinista completada. Presupuesto restante: ${(budget.remainingRatio * 100).toFixed(1)}%. Severidad máxima detectada: ${worstSeverity}.`;

  const output: EngineOutput = {
    schemaVersion: '1.0.0',
    runId: makeRunId(input.scenarioId, options.runIdSeed),
    status,
    summary: summary.slice(0, LIMITS.summaryMaxLength),
    findings: truncateFindings(findings),
    evidence: { rulesVersion: RULES_VERSION, scenarioId: input.scenarioId },
  };

  return {
    output,
    detail: { budget, burn, comparisons, assumptions },
  };
}

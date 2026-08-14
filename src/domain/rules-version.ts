/**
 * Versión de las reglas de dominio. Cambia cuando cambia la fórmula de
 * cálculo (no el código incidental). Viaja en `EngineOutput.evidence.rulesVersion`
 * para que una exportación pueda auditarse contra la versión de reglas que la
 * produjo (ver ADR-003 en 05-arquitectura-tecnica.md).
 */
export const RULES_VERSION = '1.0.0';

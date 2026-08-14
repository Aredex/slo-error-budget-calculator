<!-- generated-by: $proyecto-portafolio; date: 2026-08-14 -->
# 09 · Plan de implementación

**Proyecto:** SLO/Error Budget Calculator  
**Decisión:** GO  
**Versión del paquete:** 0.1 · 2026-08-14

## Ruta crítica

Contrato → motor puro → fixture adversarial → experiencia 30/90 s → accesibilidad/pruebas → publicación → caso de estudio.

## Fases

### F0 — Base y contratos (2 h)

- <code>P18-T01</code> crear repositorio, TypeScript estricto, lint y tests.
- <code>P18-T02</code> implementar schemas de entrada/salida y fixtures mínimos.
- <code>P18-T03</code> montar shell visual y tokens.

### F1 — Corte vertical principal (35% de 8–10 h)

- `P18-T04` implementar P18-R1: calcular error budget.
- `P18-T05` implementar P18-R2: simular burn rate.
- Añadir caso feliz, error tipado y evidencia exportable.

### F2 — Robustez del dominio (25%)

- `P18-T06` implementar P18-R3: comparar objetivos.
- `P18-T07` implementar P18-R4: explicar decisiones y supuestos.
- Añadir límites, cancelación, fixture adversarial y fallback.

### F3 — Experiencia pública (20%)

- Implementar recorrido 30/90 segundos y copy definitivo.
- Responsive, navegación por teclado, foco, estados y alternativa textual.
- Capturas automatizadas y guion de demo.

### F4 — Producción (20%)

- CI, pruebas completas, budgets de rendimiento y seguridad.
- Preview, smoke test, producción, rollback y caso de estudio.

## Dependencias

F1 depende de contratos; F2 puede avanzar junto a la UI únicamente después de estabilizar interfaces. Máximo tres workers: dominio, UI y calidad, sin compartir archivos en paralelo.

## Definición de listo

Requisito con ID, aceptación, fixture, contrato y diseño identificado.

## Definición de terminado

Código revisado, pruebas verdes, error/empty/loading, accesibilidad manual, evidencia generada, documentación y preview verificadas.

## Riesgos de ejecución

- **métricas mal definidas:** disparador observable; mitigación: fixture adversarial, validación explícita, mensaje accionable y prueba de regresión.
- **precisión engañosa:** disparador observable; mitigación: mostrar supuestos, límites y nivel de confianza; evitar lenguaje de certificación.
- **100% presentado como objetivo:** disparador observable; mitigación: fixture adversarial, validación explícita, mensaje accionable y prueba de regresión.
- **gráficas inaccesibles:** disparador observable; mitigación: semántica nativa primero, pruebas de teclado/lector y alternativa textual.
- **unidades inconsistentes:** disparador observable; mitigación: fixture adversarial, validación explícita, mensaje accionable y prueba de regresión.

## Primera tarea exacta

Crear el repositorio de <code>slo-error-budget-calculator</code>, configurar TypeScript estricto y convertir <code>contracts/input.schema.json</code> y <code>contracts/output.schema.json</code> en tipos validados con un fixture feliz y uno inválido.

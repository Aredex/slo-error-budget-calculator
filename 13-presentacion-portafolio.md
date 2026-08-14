<!-- generated-by: $proyecto-portafolio; date: 2026-08-14 -->
# 13 · Presentación de portafolio

**Proyecto:** SLO/Error Budget Calculator  
**Decisión:** GO  
**Versión del paquete:** 0.1 · 2026-08-14

## Titular

**SLO/Error Budget Calculator: Traduce fiabilidad a tiempo y decisiones operativas con supuestos visibles.**

## Estado real de producción (post-implementación)

- **Producción:** <https://slo-error-budget-calculator.pages.dev> (Cloudflare Pages, proyecto
  `slo-error-budget-calculator`). El dominio `https://slo-error-budget-calculator.alexcuesta.dev`
  quedará activo cuando el orquestador del portafolio adjunte el DNS del subdominio.
- **Repositorio:** <https://github.com/Aredex/slo-error-budget-calculator>, rama `main`, tag `v1.0.0`.
- **CI:** GitHub Actions (`quality` + `e2e`) en verde en el primer push (`gh run watch`), incluyendo
  lint, typecheck, tests unit/contrato (58 assertions), build, y E2E + axe-core (7 escenarios) sin
  violaciones de accesibilidad serias/críticas.
- **Sustituto de las "5 pruebas observadas":** no hubo usuarios humanos disponibles en este entorno de
  ejecución autónoma. En su lugar, el recorrido de 30/90s y los casos límite/adversariales quedaron
  codificados como pruebas E2E reproducibles que corren en cada push:
  `e2e/happy-path.spec.ts` (recorrido principal + cambio de parámetro + exportación + navegación por
  teclado), `e2e/adversarial-and-errors.spec.ts` (rechazo de objetivo 100%, contenido hostil sin
  ejecución, cancelación), `e2e/accessibility.spec.ts` (axe-core antes y después de ejecutar). Esto es
  honesto: es un sustituto automatizado de la observación humana, no una validación con usuarios reales;
  las métricas de "finalización ≥80%" de `02-prd.md` quedan pendientes hasta que existan pruebas con
  personas.

## Caso de estudio

1. Problema: porcentajes de disponibilidad no muestran cuánta indisponibilidad queda ni cuándo detener despliegues.
2. Restricción: demostrarlo sin VPS, datos privados ni dependencia permanente.
3. Decisión: La aplicación es estática: lógica en TypeScript dentro del navegador, procesamiento pesado en Web Worker y persistencia opcional local. No existe backend público ni datos enviados fuera del dispositivo.
4. Prueba: acción pública, fixtures adversariales, contratos y suite reproducible.
5. Resultado: publicar solo métricas obtenidas después de pruebas reales.

## Guion de demo (60–90 s)

- **0–10 s:** “Este proyecto hace visible un fallo que normalmente aparece tarde.”
- **10–30 s:** ejecutar fixture: definir SLI, objetivo y ventana para ver presupuesto, burn rate y escenarios.
- **30–55 s:** abrir una decisión, su evidencia y corrección.
- **55–75 s:** cambiar un parámetro y demostrar resultado distinto.
- **75–90 s:** mostrar contratos, pruebas y arquitectura sin VPS.

## Capturas

1. Workbench antes de ejecutar.
2. Resultado con evidencia abierta.
3. Caso adversarial o comparación.
4. Diagrama de arquitectura.
5. Test/contrato que prueba la promesa central.

## README público

Problema, demo, inicio local, arquitectura, fixtures, comandos, seguridad, accesibilidad, límites honestos y decisiones. Evitar badges sin valor y listas de tecnologías sin explicar decisiones.

## Textos reutilizables

### Malt

“Diseñé SLO/Error Budget Calculator, una demo interactiva para porcentajes de disponibilidad no muestran cuánta indisponibilidad queda ni cuándo detener despliegues. Incluye React, TypeScript, deterministic calculator, escenarios reproducibles y despliegue sin servidor dedicado.”

### Upwork

“Tengo una muestra pública relacionada: SLO/Error Budget Calculator. Permite definir SLI, objetivo y ventana para ver presupuesto, burn rate y escenarios e incluye contratos, casos adversariales y pruebas. Puedo compartir el enlace y explicar qué parte se adapta a su alcance.”

### LinkedIn

“Convertí un problema difícil de enseñar —porcentajes de disponibilidad no muestran cuánta indisponibilidad queda ni cuándo detener despliegues— en una demo que se puede probar en menos de 90 segundos. Próximamente publicaré decisiones, fallos encontrados y evidencia reproducible; no métricas inventadas.”

<!-- generated-by: $proyecto-portafolio; date: 2026-08-14 -->
# 08 · Seguridad y privacidad

**Proyecto:** SLO/Error Budget Calculator  
**Decisión:** GO  
**Versión del paquete:** 0.1 · 2026-08-14

## Activos y límites de confianza

Activos: archivos/entradas del visitante, configuración, resultados, fixtures y secretos del adaptador opcional. El navegador es un límite no confiable; cualquier Worker valida de nuevo. Los fixtures públicos nunca contienen datos reales.

## Threat model

| Riesgo | Prob. | Impacto | Control verificable |
|---|---|---|---|
| métricas mal definidas | media | alto | fixture adversarial, validación explícita, mensaje accionable y prueba de regresión |
| precisión engañosa | media | alto | mostrar supuestos, límites y nivel de confianza; evitar lenguaje de certificación |
| 100% presentado como objetivo | baja | medio | fixture adversarial, validación explícita, mensaje accionable y prueba de regresión |
| gráficas inaccesibles | baja | medio | semántica nativa primero, pruebas de teclado/lector y alternativa textual |
| unidades inconsistentes | baja | medio | fixture adversarial, validación explícita, mensaje accionable y prueba de regresión |

## Controles base

- CSP restrictiva, <code>frame-ancestors 'none'</code>, <code>nosniff</code> y Referrer-Policy.
- Dependencias fijadas, lockfile, revisión de licencias y alerta de vulnerabilidades.
- Validación por JSON Schema; límites de profundidad, tamaño, cantidad y tiempo.
- Nunca usar <code>innerHTML</code> con entrada del visitante ni ejecutar código pegado.
- No registrar payloads, tokens, archivos, prompts ni cabeceras sensibles.
- Exportación redacta campos configurados y usa <code>Content-Disposition: attachment</code>.
- Rate limit y kill switch para cualquier función pública.

## Privacidad

Telemetría mínima y sin contenido: inicio, finalización, error tipado, modo y duración agregada. Consentimiento separado para analítica. Botón de borrado local y política clara de que la herramienta no certifica seguridad ni anonimización.

## Verificación

Fixtures adversariales, dependencia caída, payload máximo, XSS en campos, cancelación, reintento y revisión manual de cabeceras antes de producción.

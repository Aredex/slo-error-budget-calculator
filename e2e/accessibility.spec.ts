import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Verificación automatizada de accesibilidad (axe-core) sobre el flujo
 * principal, en estado inicial y tras ejecutar un resultado. Complementa
 * (no sustituye) la revisión manual de teclado/VoiceOver/zoom descrita en
 * 04-sistema-visual-y-accesibilidad.md.
 */
test('sin violaciones críticas/serias de axe en el estado inicial', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const seriousOrWorse = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(seriousOrWorse, JSON.stringify(seriousOrWorse, null, 2)).toEqual([]);
});

test('sin violaciones críticas/serias de axe tras ejecutar un resultado', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ejecutar escenario' }).click();
  await expect(page.getByText('Completado', { exact: true })).toBeVisible({ timeout: 5000 });

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const seriousOrWorse = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(seriousOrWorse, JSON.stringify(seriousOrWorse, null, 2)).toEqual([]);
});

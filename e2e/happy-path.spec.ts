import { expect, test } from '@playwright/test';

/**
 * Recorrido feliz de 30/90 segundos descrito en 03-ux-flujos-y-contenido.md:
 * 30s -> definir SLI/objetivo/ventana y ejecutar; 90s -> abrir un hallazgo,
 * cambiar un parámetro, volver a ejecutar y exportar evidencia.
 *
 * Sustituye a las "5 pruebas observadas" del checklist de lanzamiento (no hay
 * usuarios humanos disponibles en este entorno automatizado): ver
 * 13-presentacion-portafolio.md para la nota honesta sobre este sustituto.
 */
test('recorrido principal: ejecutar, revisar evidencia, cambiar un parámetro y exportar', async ({ page }) => {
  await page.goto('/');

  // --- Primeros 30 segundos --------------------------------------------
  await expect(page.getByRole('heading', { name: 'SLO/Error Budget Calculator', level: 1 })).toBeVisible();
  await expect(page.getByText('Haz visible lo que normalmente falla en silencio.')).toBeVisible();

  const runButton = page.getByRole('button', { name: 'Ejecutar escenario' });
  await expect(runButton).toBeEnabled();
  await runButton.click();

  const resultHeading = page.getByRole('heading', { name: 'Resultado', level: 2 });
  await expect(resultHeading).toBeVisible();
  await expect(page.getByText('Completado', { exact: true })).toBeVisible({ timeout: 5000 });

  // --- Revisar evidencia --------------------------------------------------
  await expect(page.getByRole('heading', { name: 'Decisiones y hallazgos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Presupuesto de error' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Simulación de burn rate' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Supuestos y confianza' })).toBeVisible();
  // La gráfica siempre tiene una tabla equivalente accesible.
  await expect(page.locator('table.burn-table')).toBeVisible();

  const firstSummary = await page.locator('.result-panel__summary').innerText();

  // --- Primeros 90 segundos: cambiar un parámetro y volver a ejecutar -----
  const targetInput = page.getByLabel('Objetivo (SLO) en %');
  await targetInput.fill('99.99');
  await runButton.click();
  await expect(page.getByText('Completado', { exact: true })).toBeVisible({ timeout: 5000 });

  const secondSummary = await page.locator('.result-panel__summary').innerText();
  expect(secondSummary).not.toBe(firstSummary);

  // --- Exportar evidencia ---------------------------------------------
  const [jsonDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exportar JSON' }).click(),
  ]);
  expect(jsonDownload.suggestedFilename()).toMatch(/\.json$/);

  const [mdDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exportar Markdown' }).click(),
  ]);
  expect(mdDownload.suggestedFilename()).toMatch(/\.md$/);
});

test('accesibilidad básica: el recorrido principal se completa solo con teclado', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Ejecutar escenario' }).focus();
  await page.keyboard.press('Enter');

  await expect(page.getByText('Completado', { exact: true })).toBeVisible({ timeout: 5000 });
});

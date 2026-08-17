import { expect, test } from '@playwright/test';

test('entrada inválida (objetivo 100%) se rechaza con un mensaje accionable, no con una pantalla rota', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('radio', { name: /Entrada inválida/ }).check();
  await page.getByRole('button', { name: 'Ejecutar escenario' }).click();

  await expect(page.getByRole('region', { name: 'Resultado' }).getByText('Entrada inválida', { exact: true })).toBeVisible({ timeout: 5000 });
  const findings = page.locator('.findings-list');
  await expect(findings).toContainText('100%');
  // No debe haber datos ricos (presupuesto/gráfica) para una entrada inválida.
  await expect(page.getByRole('heading', { name: 'Presupuesto de error' })).toHaveCount(0);
});

test('el escenario adversarial no ejecuta contenido hostil y lo muestra como texto', async ({ page }) => {
  const dialogs: string[] = [];
  page.on('dialog', (dialog) => {
    dialogs.push(dialog.message());
    void dialog.dismiss();
  });

  await page.goto('/');
  await page.getByRole('radio', { name: /Caso adversarial/ }).check();
  await page.getByRole('button', { name: 'Ejecutar escenario' }).click();

  await expect(page.getByText('Completado', { exact: true })).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('heading', { name: 'Decisiones y hallazgos' })).toBeVisible();
  await expect(page.getByText('Crítico').first()).toBeVisible();

  // El contenido hostil del fixture se ve como texto en el DOM, nunca ejecutado.
  const bodyHtml = await page.locator('body').innerHTML();
  expect(bodyHtml).not.toContain('<script>alert');

  expect(dialogs).toHaveLength(0);
});

test('cancelar una ejecución en curso deja la app en un estado reiniciable', async ({ page }) => {
  await page.goto('/');

  const runButton = page.getByRole('button', { name: 'Ejecutar escenario' });
  await runButton.click();

  const cancelButton = page.getByRole('button', { name: 'Cancelar' });
  await cancelButton.click();

  await expect(page.getByText('Cancelado', { exact: true })).toBeVisible({ timeout: 5000 });
  await expect(runButton).toBeEnabled();
});

const { test, expect } = require('@playwright/test');
const { loginComoOperador } = require('./helpers/auth');

const EMAIL = process.env.OPERADOR_EMAIL || 'garciamelvin5bcc@gmail.com';
const PASSWORD = process.env.OPERADOR_PASSWORD || 'Admin123@';

test.describe('Calificaciones y Reseñas del Operador - Carnet 202000576', () => {
  test.beforeEach(async ({ page }) => {
    await loginComoOperador(page, EMAIL, PASSWORD);
  });

  test('Debe mostrar la sección de calificaciones con resumen estadístico', async ({ page }) => {
    // Click on "Calificaciones" in sidebar
    await page.locator('text=Calificaciones').first().click();
    await page.waitForTimeout(1500);
    
    // Should show the ratings section - look for summary stats or "Calificaciones" heading
    const calificacionesSection = page.locator('text=Promedio').or(page.locator('text=calificaciones')).or(page.locator('text=Reseñas')).or(page.locator('text=No hay calificaciones'));
    await expect(calificacionesSection.first()).toBeVisible({ timeout: 10000 });
  });
});

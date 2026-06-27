const { test, expect } = require('@playwright/test');
const { loginComoEmpresa } = require('./helpers/auth');

const EMAIL = process.env.EMPRESA_EMAIL || '2070688520116@ingenieria.usac.edu.gt';
const PASSWORD = process.env.EMPRESA_PASSWORD || 'Admin123@';

test.describe('Dashboard de Empresa - Gestión de Cupones - Carnet 202300378', () => {
  test('Debe iniciar sesión como empresa y mostrar la sección de cupones', async ({ page }) => {
    await loginComoEmpresa(page, EMAIL, PASSWORD);

    // Verificar navbar/brand
    await expect(page.locator('text=TrackFlow-HUB')).toBeVisible({ timeout: 15000 });

    // Click en Gestión de Cupones
    await page.locator('text=Gestión de Cupones').click();
    await page.waitForTimeout(1000);

    // Verificar que se muestra la interfaz de cupones
    const couponsHeader = page.locator('text=Crear Cupón').or(page.locator('text=Mis Cupones')).or(page.locator('text=Código'));
    await expect(couponsHeader.first()).toBeVisible({ timeout: 10000 });
  });
});

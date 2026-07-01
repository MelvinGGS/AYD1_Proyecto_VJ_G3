const { test, expect } = require('@playwright/test');
const { loginComoEmpresa } = require('./helpers/auth');

const EMAIL = process.env.EMPRESA_EMAIL || '2070688520116@ingenieria.usac.edu.gt';
const PASSWORD = process.env.EMPRESA_PASSWORD || 'Admin123@';

test.describe('Dashboard de Empresa - Gestión de Flota de Vehículos - Carnet 202000576', () => {
  test('Debe iniciar sesión como empresa, registrar un vehículo, cambiar su estado, eliminarlo y cerrar sesión', async ({ page }) => {
    await loginComoEmpresa(page, EMAIL, PASSWORD);

    // Verificar que el dashboard de empresa cargó
    await expect(page.locator('text=TrackFlow-HUB').first()).toBeVisible({ timeout: 15000 });

    // Clic en navbar-toggler si es visible (para responsive)
    const toggler = page.locator('.navbar-toggler');
    if (await toggler.isVisible()) {
      await toggler.click();
      await page.waitForTimeout(500);
    }

    // Navegar a Flota Vehículos
    await page.locator('button:has-text("Flota Vehículos")').click();
    await page.waitForTimeout(1500);

    // Verificar que la sección de flota cargó
    await expect(page.locator('text=Registrar Vehículo').first()).toBeVisible({ timeout: 10000 });

    // Generar una placa única para evitar colisiones
    const randomPlacaNum = Math.floor(100000 + Math.random() * 900000);
    const placaUnica = `C-${randomPlacaNum}`;

    // Llenar campos de registro
    await page.locator('input[placeholder="Ej. Microbús, Autobús, Camión"]').fill('Microbús E2E');
    await page.locator('input[placeholder="Ej. C-908BXD"]').fill(placaUnica);
    await page.locator('input[placeholder="Ej. 45"]').fill('15');
    await page.locator('input[placeholder="Ej. Scania"]').fill('Toyota Hiace');
    await page.locator('input[placeholder="Ej. 2022"]').fill('2021');

    // Click en Registrar Vehículo
    await page.locator('button:has-text("Registrar Vehículo")').click();
    await page.waitForTimeout(2000);

    // Verificar mensaje de éxito
    const successMsg = page.locator('text=exitosamente');
    await expect(successMsg.first()).toBeVisible({ timeout: 10000 });

    // Encontrar la tarjeta específica usando la clase .rounded y filtrando por la placa única
    const vehicleCard = page.locator('.rounded').filter({ hasText: placaUnica }).first();
    await expect(vehicleCard).toBeVisible({ timeout: 10000 });

    // Cambiar estado a "mantenimiento" usando el botón dentro de la tarjeta de ese vehículo
    const maintenanceBtn = vehicleCard.locator('button:has-text("mantenimiento")');
    await maintenanceBtn.click();
    await page.waitForTimeout(2000);

    // Eliminar el vehículo
    const deleteBtn = vehicleCard.locator('button:has-text("Eliminar")');
    await deleteBtn.click();
    await page.waitForTimeout(2000);

    // Verificar que el vehículo con la placa única ya no esté visible
    await expect(page.locator(`text=${placaUnica}`)).not.toBeVisible();

    // Clic en navbar-toggler si es visible antes de cerrar sesión
    if (await toggler.isVisible()) {
      await toggler.click();
      await page.waitForTimeout(500);
    }

    // Cerrar sesión
    await page.locator('text=Cerrar sesion').click();
    await page.waitForTimeout(1000);

    // Verificar redirección
    await expect(page).toHaveURL('http://localhost:5173/');
  });
});

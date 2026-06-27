const { test, expect } = require('@playwright/test');
const { loginComoOperador } = require('./helpers/auth');

const EMAIL = process.env.OPERADOR_EMAIL || 'garciamelvin5bcc@gmail.com';
const PASSWORD = process.env.OPERADOR_PASSWORD || 'Admin123@';

test.describe('Gestión de Servicios del Operador - Carnet 202307378', () => {
  test.beforeEach(async ({ page }) => {
    await loginComoOperador(page, EMAIL, PASSWORD);
  });

  test('Debe mostrar el formulario de creación de servicios', async ({ page }) => {
    // Click on "Gestión de Servicios" in sidebar
    await page.locator('text=Gestión de Servicios').click();
    await page.waitForTimeout(1000);
    
    // Verify the service creation form is visible
    await expect(page.locator('text=Crear Nuevo Servicio').or(page.locator('text=Nuevo Servicio'))).toBeVisible({ timeout: 10000 });
    
    // Verify form fields exist
    await expect(page.locator('input[placeholder*="Envio Express"], input[placeholder*="servicio"], input[name="nombreServicio"]').first()).toBeVisible();
    
    // Verify "Mis Servicios Registrados" section exists
    await expect(page.locator('text=Mis Servicios Registrados').or(page.locator('text=Servicios Registrados'))).toBeVisible();
  });
});

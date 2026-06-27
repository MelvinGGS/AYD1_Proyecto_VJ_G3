const { test, expect } = require('@playwright/test');
const { loginComoEmpresa } = require('./helpers/auth');

const EMAIL = process.env.EMPRESA_EMAIL || '2070688520116@ingenieria.usac.edu.gt';
const PASSWORD = process.env.EMPRESA_PASSWORD || 'Admin123@';

test.describe('Login y Logout de la Empresa - Carnet 202307272', () => {
  test('Debe iniciar sesión, verificar el dashboard de la empresa y luego cerrar sesión', async ({ page }) => {
    await loginComoEmpresa(page, EMAIL, PASSWORD);
    
    // Verificar que estamos en el dashboard de la empresa
    await expect(page.locator('text=TrackFlow-HUB')).toBeVisible({ timeout: 15000 });
    
    // Verificar que se ve la barra lateral de la empresa
    await expect(page.locator('text=Inicio')).toBeVisible();
    await expect(page.locator('text=Gestión de Rutas')).toBeVisible();
    
    // Hacer clic en Cerrar sesion
    await page.locator('text=Cerrar sesion').click();
    await page.waitForTimeout(1000);
    
    // Verificar que redirige a la página de login (la URL de login en App.jsx es "/")
    await expect(page).toHaveURL('http://localhost:5173/');
  });
});

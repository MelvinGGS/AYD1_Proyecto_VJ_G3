const { test, expect } = require('@playwright/test');
const { loginComoOperador } = require('./helpers/auth');

const EMAIL = process.env.OPERADOR_EMAIL || 'garciamelvin5bcc@gmail.com';
const PASSWORD = process.env.OPERADOR_PASSWORD || 'Admin123@';

test.describe('Login y Logout del Operador Logístico - Carnet 202300712', () => {
  test('Debe iniciar sesión, verificar el dashboard del operador y luego cerrar sesión', async ({ page }) => {
    await loginComoOperador(page, EMAIL, PASSWORD);
    
    // Verificar que estamos en el dashboard del operador
    await expect(page.locator('text=TrackFlow-HUB')).toBeVisible({ timeout: 15000 });
    
    // Verify the sidebar navigation items are present
    await expect(page.locator('text=Inicio')).toBeVisible();
    await expect(page.locator('text=Gestión de Servicios')).toBeVisible();
    
    // Hacer clic en Cerrar sesion
    await page.locator('text=Cerrar sesion').click();
    await page.waitForTimeout(1000);
    
    // Verificar que redirige a la página de login (la URL de login en App.jsx es "/")
    await expect(page).toHaveURL('http://localhost:5173/');
  });
});

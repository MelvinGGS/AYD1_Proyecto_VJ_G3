const { test, expect } = require('@playwright/test');
const { loginComoCliente } = require('./helpers/auth');

const EMAIL = process.env.CLIENTE_EMAIL || 'melvinggs16@gmail.com';
const PASSWORD = process.env.CLIENTE_PASSWORD || 'Admin123@';

test.describe('Cliente - Editar Perfil - Carnet 202307272', () => {
  test('Debe iniciar sesión como cliente, cambiar datos del perfil, confirmar y cerrar sesión', async ({ page }) => {
    await loginComoCliente(page, EMAIL, PASSWORD);
    
    // Verificar dashboard del cliente
    await expect(page.locator('text=TrackFlow-HUB').first()).toBeVisible({ timeout: 15000 });
    
    // Ir a Perfil - usando selector de botón exacto para evitar conflictos de múltiples elementos
    await page.locator('button:has-text("Mi Perfil")').first().click();
    await page.waitForTimeout(1000);
    
    // Editar nombre
    await page.locator('input[placeholder="Tu nombre"]').fill('Melvin Editado');
    await page.locator('input[placeholder="Tu apellido"]').fill('Prueba Editada');
    await page.locator('input[placeholder="44445555"]').fill('12345678');
    
    // Guardar cambios
    await page.locator('text=Guardar Cambios').click();
    await page.waitForTimeout(1000);
    
    // Confirmar modal
    await page.locator('.modal-acciones >> text=Confirmar').click();
    await page.waitForTimeout(1500);
    
    // Cerrar sesión
    await page.locator('text=Cerrar Sesión').click();
    await page.waitForTimeout(1000);
    
    // Verificar que redirige a login
    await expect(page).toHaveURL('http://localhost:5173/');
  });
});

const { test, expect } = require('@playwright/test');
const { loginComoOperador } = require('./helpers/auth');

const EMAIL = process.env.OPERADOR_EMAIL || 'garciamelvin5bcc@gmail.com';
const PASSWORD = process.env.OPERADOR_PASSWORD || 'Admin123@';

test.describe('Gestión de Servicios del Operador - Editar Servicio - Carnet 202307378', () => {
  test('Debe iniciar sesión, navegar a Gestión de Servicios, editar precio y horario de un servicio existente, guardar y cerrar sesión', async ({ page }) => {
    await loginComoOperador(page, EMAIL, PASSWORD);

    // Verificar que el dashboard del operador cargó
    await expect(page.locator('text=TrackFlow-HUB').first()).toBeVisible({ timeout: 15000 });

    // Clic en navbar-toggler si es visible (para responsive)
    const toggler = page.locator('.navbar-toggler');
    if (await toggler.isVisible()) {
      await toggler.click();
      await page.waitForTimeout(500);
    }

    // Navegar a Gestión de Servicios
    await page.locator('button:has-text("Gestión de Servicios")').click();
    await page.waitForTimeout(1500);

    // Verificar que la sección de servicios cargó (esperar a que la lista cargue)
    await expect(page.locator('text=Mis Servicios Registrados').first()).toBeVisible({ timeout: 10000 });

    // Esperar a que los servicios carguen y verificar que hay al menos un botón "Editar"
    await expect(page.locator('button:has-text("Editar")').first()).toBeVisible({ timeout: 10000 });

    // Hacer clic en "Editar" del primer servicio
    await page.locator('button:has-text("Editar")').first().click();
    await page.waitForTimeout(1000);

    // Verificar que el formulario cambió a modo edición
    await expect(page.locator('text=Editar Servicio').first()).toBeVisible({ timeout: 5000 });

    // Seleccionar día Lunes (el horario puede estar vacío si el formato original no coincide)
    const checkLunes = page.locator('#check-Lunes');
    await checkLunes.check();
    await page.waitForTimeout(300);

    // Seleccionar también Martes para un horario más completo
    const checkMartes = page.locator('#check-Martes');
    await checkMartes.check();
    await page.waitForTimeout(300);

    // Llenar hora de inicio y fin
    await page.locator('input[name="horario_hora_inicio"]').fill('08:00');
    await page.locator('input[name="horario_hora_fin"]').fill('17:00');
    await page.waitForTimeout(300);

    // Modificar el precio del envío
    await page.locator('input[name="precio_envio"]').fill('55.00');
    await page.waitForTimeout(300);

    // Hacer clic en "Guardar Cambios"
    await page.locator('button:has-text("Guardar Cambios")').click();
    await page.waitForTimeout(2000);

    // Verificar el mensaje de éxito (alert-success con "modificado exitosamente" o similar)
    await expect(page.locator('.alert-success').first()).toBeVisible({ timeout: 10000 });

    // Clic en navbar-toggler si es visible antes de cerrar sesión
    if (await toggler.isVisible()) {
      await toggler.click();
      await page.waitForTimeout(500);
    }

    // Cerrar sesión
    await page.locator('text=Cerrar sesion').click();
    await page.waitForTimeout(1000);

    // Verificar redirección al login
    await expect(page).toHaveURL('http://localhost:5173/');
  });
});

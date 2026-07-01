const { test, expect } = require('@playwright/test');
const { loginComoEmpresa } = require('./helpers/auth');

const EMAIL = process.env.EMPRESA_EMAIL || '2070688520116@ingenieria.usac.edu.gt';
const PASSWORD = process.env.EMPRESA_PASSWORD || 'Admin123@';

test.describe('Dashboard de Empresa - Crear Cupón y Enviar a Cliente - Carnet 202300378', () => {
  test('Debe iniciar sesión como empresa, crear un cupón con código aleatorio, verificar creación, enviarlo a un cliente y cerrar sesión', async ({ page }) => {
    await loginComoEmpresa(page, EMAIL, PASSWORD);

    // Verificar que el dashboard de empresa cargó
    await expect(page.locator('text=TrackFlow-HUB').first()).toBeVisible({ timeout: 15000 });

    // Clic en navbar-toggler si es visible (para responsive)
    const toggler = page.locator('.navbar-toggler');
    if (await toggler.isVisible()) {
      await toggler.click();
      await page.waitForTimeout(500);
    }

    // Navegar a Gestión de Cupones
    await page.locator('button:has-text("Gestión de Cupones")').click();
    await page.waitForTimeout(1500);

    // Verificar que la sección de cupones cargó
    await expect(page.locator('text=Crear Cupón').first()).toBeVisible({ timeout: 10000 });

    // Generar código de cupón aleatorio para evitar colisiones en DB
    const codigoAleatorio = 'E2E' + Math.floor(Math.random() * 1000000);

    // Llenar el formulario de creación de cupón
    await page.locator('input[placeholder="Ej. VERANO2026"]').fill(codigoAleatorio);
    await page.locator('input[placeholder="Ej. Descuento de temporada"]').fill('Cupón de prueba E2E');

    // Tipo de descuento: porcentaje
    await page.locator('select').first().selectOption('porcentaje');

    // Valor del descuento
    await page.locator('input[placeholder="Ej. 10"]').fill('20');

    // Fechas: inicio mañana, fin en 30 días
    const hoy = new Date();
    const manana = new Date(hoy.getTime() + 1 * 24 * 60 * 60 * 1000);
    const fin = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
    const formatearFecha = (d) => d.toISOString().split('T')[0];

    await page.locator('input[type="date"]').first().fill(formatearFecha(manana));
    await page.locator('input[type="date"]').last().fill(formatearFecha(fin));

    // Hacer clic en "Crear Cupón" (botón de submit del formulario)
    await page.locator('button:has-text("Crear Cupón")').click();
    await page.waitForTimeout(2000);

    // Verificar mensaje de éxito: debe contener "exitosamente"
    await expect(page.locator('text=exitosamente').first()).toBeVisible({ timeout: 10000 });

    // Verificar que el cupón aparece en la lista "Mis Cupones" con su código
    await expect(page.locator(`text=${codigoAleatorio}`).first()).toBeVisible({ timeout: 10000 });

    // Enviar el cupón al correo de un cliente
    await page.locator('input[placeholder="Correo del cliente"]').first().fill('melvinggs16@gmail.com');
    await page.waitForTimeout(500);

    // Hacer clic en "Enviar" (el botón de envío del primer cupón en la lista)
    await page.locator('button:has-text("Enviar")').first().click();
    await page.waitForTimeout(2000);

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

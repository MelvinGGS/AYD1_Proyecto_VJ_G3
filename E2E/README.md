# Pruebas End-to-End (E2E)

Las pruebas E2E se encuentran en esta carpeta y simulan el flujo completo utilizando navegadores reales (Chromium) con Playwright.

## Requisitos Previos

* El backend debe estar corriendo en: http://localhost:3000
* El frontend debe estar corriendo en: http://localhost:5173

## Instalacion

1. Navega a esta carpeta:
   ```bash
   cd E2E
   ```

2. Instala las dependencias y el navegador Chromium:
   ```bash
   npm install
   npx playwright install chromium
   ```

## Ejecucion de Pruebas

Ejecuta las pruebas en modo headless (segundo plano):
```bash
npm test
```

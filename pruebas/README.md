## 1. Pruebas Unitarias (Jest)

Las pruebas unitarias se encuentran en el directorio `./unitarias` y mockean la base de datos y utilidades externas para probar la lógica de los controladores de forma aislada.

### Instalación
1. Navega al directorio de pruebas unitarias:
   ```bash
   cd pruebas/unitarias
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```

### Ejecución de Pruebas
* **Ejecutar todas las pruebas**:
  ```bash
  npm test
  ```

---

## 2. Pruebas E2E 

Las pruebas E2E se encuentran en el directorio `./E2E` y simulan el flujo completo utilizando navegadores reales (Chromium).

### Requisitos previos
El backend debe estar corriendo en `http://localhost:3000` y el frontend en `http://localhost:5173`.

### Instalación
1. Navega al directorio de E2E:
   ```bash
   cd pruebas/E2E
   ```
2. Instala las dependencias y el navegador Chromium:
   ```bash
   npm install
   npx playwright install chromium
   ```

### Ejecución de Pruebas
Ejecuta las pruebas en modo headless (segundo plano):
```bash
npm test
```

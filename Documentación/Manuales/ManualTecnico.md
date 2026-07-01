<div align="center">

# TRACKFLOW-HUB

### Sistema de Gestión de Envíos y Logística

---

### Manual Técnico

**Análisis y Diseño de Sistemas 1**

Facultad de Ingeniería

Universidad de San Carlos de Guatemala

**Grupo 3**

**Escuela de Vacaciones 2026**

---

### Equipo de Desarrollo

| Integrante | Carné |
|------------|--------|
| Melvin Geovanni García Sumalá | 202300712 |
| Maria Fernanda Morales Lima | 202300378 |
| Josue David Figueroa Acosta | 202307378 |
| Bryan Alejandro Anona Paredes | 202307272 |
| Susana Paola González Contreras | 202000576 |

</div>

---

<div align="center">

# Contenido

</div>

<div align="justify">

1. Información General
2. Objetivos
3. Tecnologías Utilizadas
4. Arquitectura
5. Estructura del Proyecto
6. Instalación y Configuración
7. Base de Datos
8. Comunicación Frontend-Backend
9. GitFlow
10. Principios de Nielsen
11. Pruebas
12. Problemas y Soluciones
13. Conclusiones
14. Anexos

</div>

---

<div align="center">

# 1. Información General

</div>

<div align="justify">

TrackFlow-HUB es una plataforma web desarrollada para facilitar la gestión de envíos y servicios de transporte de manera sencilla, rápida y segura. El sistema centraliza las principales operaciones del mercado logístico en un solo lugar, ofreciendo una experiencia intuitiva que optimiza el proceso de coordinación de envíos.

La plataforma incluye funcionalidades de gestión de paquetes, métodos de pago seguros, administración de rutas y flota, generación de cupones de descuento y soporte administrativo. Su objetivo principal es proporcionar una herramienta eficiente que reduzca el tiempo y la complejidad asociados a la gestión de envíos y transporte de paquetes.

El sistema contempla cuatro tipos de usuarios: clientes, operadores logísticos, empresas de transporte y administradores, cada uno con su propio módulo y funcionalidades específicas.

</div>

---

<div align="center">

# 2. Objetivos

</div>

<div align="justify">

### Objetivo General

Desarrollar una plataforma web funcional y escalable para la gestión de envíos, paquetes y servicios logísticos que permita a clientes, operadores y administradores interactuar de manera eficiente, asegurando la calidad del software mediante pruebas unitarias, pruebas end-to-end y despliegue en la nube.

### Objetivos Específicos

- Diseñar e implementar los módulos principales del sistema según los roles definidos, garantizando que cada usuario pueda realizar sus funciones clave dentro de una interfaz intuitiva y segura.
- Mantener una base de código modular y testeable, integrando pruebas unitarias para validar el correcto funcionamiento de componentes individuales.
- Desarrollar flujos completos de interacción y realizar pruebas end-to-end que aseguren que los procesos críticos del sistema se ejecuten correctamente desde la perspectiva del usuario final.
- Establecer una arquitectura de software desplegada en un servicio en la nube utilizando contenedores Docker.
- Implementar un proceso de Integración Continua y Despliegue Continuo (CI/CD) para lograr un despliegue eficiente y automatizado del backend.
- Aplicar principios heurísticos de Nielsen en el diseño de la interfaz de usuario para garantizar una experiencia de uso intuitiva y accesible.

</div>

---

<div align="center">

# 3. Tecnologías Utilizadas

</div>

<div align="justify">

| Tecnología | Uso |
|------------|-----|
| React | Desarrollo de la interfaz de usuario mediante componentes reutilizables y navegación dinámica. |
| React Router DOM | Gestión de rutas y navegación entre las diferentes vistas del sistema. |
| Vite | Herramienta de construcción y servidor de desarrollo para el frontend. |
| CSS3 con Variables | Personalización de estilos, paleta de colores y diseño visual de la aplicación. |
| Bootstrap | Componentes visuales responsivos para formularios, tablas y elementos de interfaz. |
| Fetch API | Comunicación entre el Frontend y el Backend mediante solicitudes HTTP. |
| Node.js | Entorno de ejecución para el Backend. |
| Express.js | Framework para el desarrollo de la API REST del Backend. |
| PostgreSQL 15 | Sistema gestor de base de datos relacional para almacenamiento de información. |
| Docker | Contenedorización de la base de datos para facilitar el despliegue y configuración. |
| JWT (JSON Web Token) | Autenticación y autorización de usuarios mediante tokens de acceso seguros. |
| Nodemailer | Envío de correos electrónicos desde el Backend para notificaciones y verificaciones. |
| Multer | Manejo de archivos subidos por los usuarios, incluyendo imágenes y CSV. |
| bcrypt | Cifrado seguro de contraseñas almacenadas en la base de datos. |
| csv-parser | Procesamiento de archivos CSV para carga masiva de rutas y flota. |
| Jest | Framework para pruebas unitarias del Backend. |
| Playwright | Framework para pruebas End-to-End del Frontend. |
| Git | Control de versiones y seguimiento de cambios durante el desarrollo. |
| GitHub | Gestión colaborativa del repositorio y administración del código fuente. |

## Justificación de las Tecnologías Utilizadas

### React con Vite

Se eligió React para el desarrollo del Frontend debido a que permite construir interfaces modernas utilizando componentes reutilizables. Vite fue seleccionado como herramienta de construcción por su velocidad en el servidor de desarrollo y su eficiencia en la generación de builds de producción. Esta combinación facilitó la organización del proyecto y permitió dividir el trabajo entre los integrantes del equipo.

### Node.js con Express.js

Se seleccionó Node.js con Express.js para el desarrollo del Backend por su capacidad de manejar múltiples solicitudes concurrentes de manera eficiente, su amplio ecosistema de paquetes disponibles mediante npm y su facilidad de integración con PostgreSQL. Express.js proporcionó una estructura clara para la definición de rutas y middlewares de la API REST.

### PostgreSQL 15

PostgreSQL fue elegido como sistema gestor de base de datos por su estabilidad, soporte completo de tipos de datos personalizados (enums, UUID, JSONB), integridad referencial mediante foreign keys y capacidad de manejar transacciones complejas. Estas características fueron especialmente útiles para la gestión de reservaciones, pagos y cupones del sistema.

### Docker

Docker fue utilizado para contenedorizar la base de datos PostgreSQL, garantizando que todos los integrantes del equipo trabajaran con el mismo entorno de base de datos independientemente de su sistema operativo. Esto eliminó problemas de compatibilidad y facilitó la configuración inicial del entorno de desarrollo.

### JWT

JWT fue implementado para gestionar la autenticación y autorización de los cuatro tipos de usuarios del sistema. Su principal ventaja es que permite identificar de manera segura a los usuarios mediante tokens sin necesidad de almacenar sesiones activas en el servidor, mejorando la escalabilidad del sistema.

### Nodemailer

Nodemailer fue utilizado para el envío de correos electrónicos de verificación de cuenta, notificaciones de aprobación o rechazo de solicitudes, envío de cupones de descuento y notificaciones de cancelación de rutas. Se integró con Gmail mediante credenciales configuradas en variables de entorno.

### Jest y Playwright

Jest fue utilizado para las pruebas unitarias del Backend, permitiendo probar las funciones de los controladores de manera aislada mediante mocks. Playwright fue utilizado para las pruebas End-to-End, simulando la interacción real de un usuario con la interfaz del sistema.

### Git y GitHub

Git y GitHub fueron utilizados para el control de versiones y la colaboración entre los integrantes del equipo, implementando la metodología GitFlow con ramas de feature, develop, release y main.

</div>

---

<div align="center">

# 4. Arquitectura

</div>

<div align="justify">

La arquitectura implementada sigue el modelo cliente-servidor de tres capas. El usuario interactúa con una interfaz desarrollada en React, la cual consume servicios REST mediante Fetch API. Las solicitudes son procesadas por el Backend desarrollado en Node.js con Express.js, encargado de la lógica de negocio, autenticación mediante JWT y validaciones correspondientes. Finalmente, la información es almacenada y consultada desde PostgreSQL 15 ejecutándose en un contenedor Docker.

La comunicación entre el Frontend y el Backend se realiza mediante solicitudes HTTP en formato JSON. Para permitir la comunicación entre aplicaciones ejecutadas en diferentes puertos durante el desarrollo, se implementó el middleware CORS en el Backend.

El sistema implementa un modelo de autenticación stateless mediante JWT, donde cada solicitud al Backend incluye el token en el encabezado Authorization, permitiendo al servidor verificar la identidad y rol del usuario sin consultar la base de datos en cada petición.

</div>

---

<div align="center">

# 5. Estructura del Proyecto

</div>

<div align="justify">

La estructura del proyecto fue dividida en tres componentes principales: Frontend, Backend y Base de Datos.

### Descripción de Directorios

| Directorio / Archivo | Descripción |
|----------------------|-------------|
| backend/ | Contiene toda la lógica del servidor desarrollada en Node.js con Express. |
| backend/config/ | Archivos de configuración de la aplicación y conexión a la base de datos. |
| backend/controllers/ | Controladores encargados de recibir y procesar las solicitudes HTTP por módulo. |
| backend/middlewares/ | Middleware para autenticación JWT, autorización por rol y manejo de archivos. |
| backend/routes/ | Definición de rutas y endpoints de la API REST organizados por módulo. |
| backend/utils/ | Funciones auxiliares como el mailer para envío de correos. |
| backend/uploads/ | Carpeta donde se almacenan temporalmente los archivos subidos por los usuarios. |
| backend/index.js | Punto de entrada principal de la aplicación Backend. |
| backend/.env | Variables de entorno con credenciales y configuración sensible. |
| database/ | Contiene los recursos relacionados con la base de datos. |
| database/01-schema.sql | Script que crea e inicializa la estructura completa de la base de datos. |
| database/docker-compose.yml | Configuración para desplegar PostgreSQL mediante Docker. |
| frontend/ | Contiene toda la aplicación cliente desarrollada en React con Vite. |
| frontend/public/ | Archivos públicos accesibles directamente desde el navegador. |
| frontend/src/ | Código fuente principal del Frontend. |
| frontend/src/assets/ | Recursos estáticos como imágenes e íconos PNG. |
| frontend/src/estilos/ | Archivos CSS personalizados para cada módulo de la interfaz. |
| frontend/src/paginas/ | Vistas principales organizadas por tipo de usuario. |
| frontend/src/paginas/dashboards/ | Dashboards de cada tipo de usuario (Admin, Cliente, Empresa, Operador). |
| frontend/src/paginas/dashboards/componentes/ | Componentes reutilizables dentro de los dashboards. |
| frontend/src/paginas/usuario/ | Páginas de autenticación (Login, Registro). |
| frontend/src/App.jsx | Componente principal con la configuración de rutas del Frontend. |
| frontend/src/main.jsx | Punto de entrada de la aplicación React. |
| pruebas/ | Contiene todas las pruebas del sistema. |
| pruebas/unitarias/ | Pruebas unitarias de los controladores del Backend usando Jest. |
| pruebas/E2E/ | Pruebas End-to-End del Frontend usando Playwright. |
| docs/ | Documentación del proyecto incluyendo manuales y diagramas. |

</div>

---

<div align="center">

# 6. Instalación y Configuración

</div>

<div align="justify">

## 6.1 Requisitos Previos

Antes de ejecutar el sistema es necesario contar con las siguientes herramientas instaladas:

- Node.js v20 o superior
- npm v9 o superior
- Docker Desktop
- Docker Compose
- Git
- Visual Studio Code (recomendado)

---

## 6.2 Clonar el Repositorio

```bash
git clone https://github.com/MelvinGGS/AYD1_Proyecto_VJ_G3.git
cd AYD1_Proyecto_VJ_G3
```

---

## 6.3 Configuración de la Base de Datos

La base de datos PostgreSQL se ejecuta mediante un contenedor Docker.

### Levantar el contenedor

```bash
cd database
docker-compose up -d
```

### Verificar que el contenedor está corriendo

```bash
docker ps
```

Debe aparecer el contenedor `trackflow-db` en estado `Up`.

### Verificar tablas creadas

```bash
docker exec -it trackflow-db psql -U admin -d trackflow_db -c "\dt"
```

---

## 6.4 Configuración del Backend

### Ingresar al directorio backend

```bash
cd backend
```

### Instalar dependencias

```bash
npm install
```

### Configurar variables de entorno

Crear el archivo `.env` en la carpeta `backend/` con el siguiente contenido:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=trackflow_db
JWT_SECRET=trackflow_secret_2026
EMAIL_USER=correo@gmail.com
EMAIL_PASS=contraseña_de_aplicacion
```

### Ejecutar el servidor

```bash
npm run dev
```

El servidor se ejecutará en:

```text
http://localhost:3000
```

---

## 6.5 Configuración del Frontend

### Ingresar al directorio frontend

```bash
cd frontend
```

### Instalar dependencias

```bash
npm install
```

### Ejecutar la aplicación

```bash
npm run dev
```

La aplicación se ejecutará en:

```text
http://localhost:5173
```

---

## 6.6 Credenciales de Acceso para Pruebas

| Tipo de Usuario | Correo | Contraseña |
|----------------|--------|------------|
| Administrador | eventcoreg3@gmail.com | Admin123 |

---

## 6.7 Credenciales de la Base de Datos

| Parámetro | Valor |
|-----------|-------|
| Host | localhost |
| Puerto | 5432 |
| Usuario | admin |
| Password | admin123 |
| Base de Datos | trackflow_db |

---

## 6.8 Orden de Inicio del Sistema

Para que el sistema funcione correctamente, los servicios deben iniciarse en el siguiente orden:

1. Base de datos (Docker)
2. Backend (Node.js)
3. Frontend (React + Vite)

### Comandos completos en orden

```bash
# 1. Base de datos
cd database && docker-compose up -d

# 2. Backend
cd backend && npm run dev

# 3. Frontend (en otra terminal)
cd frontend && npm run dev
```

---

## 6.9 Detener los Servicios

### Detener el contenedor de base de datos

```bash
cd database
docker-compose down
```

### Eliminar contenedor y datos

```bash
docker-compose down -v
```

> Esta acción elimina todos los datos almacenados en la base de datos.

---

## 6.10 Observaciones

- Ejecutar primero la base de datos antes de iniciar el Backend.
- Verificar que el puerto 5432 esté disponible para PostgreSQL.
- Verificar que el puerto 3000 esté disponible para el Backend.
- Verificar que el puerto 5173 esté disponible para el Frontend.
- La carpeta `node_modules` no debe incluirse en el repositorio.
- El archivo `.env` no debe subirse al repositorio por seguridad.

</div>

---

<div align="center">

# 7. Base de Datos

</div>

<div align="justify">

La base de datos fue diseñada en PostgreSQL 15 siguiendo principios de normalización para reducir la redundancia de datos y mantener la integridad de la información. Se utilizaron tipos de datos personalizados (enums) para representar estados y roles del sistema.

## Tipos Enumerados (Enums) Utilizados

| Enum | Valores |
|------|---------|
| user_role | cliente, operador, empresa_transporte, administrador |
| booking_status | en_carrito, pendiente_pago, confirmado, en_transito, entregado, cancelado, reembolsado |
| coupon_status | activo, expirado, agotado |
| coupon_discount_type | porcentaje, monto_fijo |
| profile_change_status | pendiente, aceptado, rechazado |
| report_status | enviado, en_revision, aceptado, rechazado |
| payment_status | pendiente, completado, fallido, reembolsado |

## Tablas Principales del Sistema

| # | Tabla | Descripción |
|---|-------|-------------|
| 1 | usuarios | Información base de todos los tipos de usuario |
| 2 | clientes | Datos específicos de clientes |
| 3 | operadores_logisticos | Datos específicos de operadores |
| 4 | empresas_transporte | Datos específicos de empresas de transporte |
| 5 | administradores | Datos específicos de administradores |
| 6 | solicitudes_registro | Solicitudes de registro pendientes de aprobación |
| 7 | rutas_transporte | Rutas ofrecidas por empresas de transporte |
| 8 | servicios_envio | Servicios de envío ofrecidos por operadores |
| 9 | reservaciones | Reservaciones realizadas por clientes |
| 10 | carrito_compras | Servicios en el carrito pendientes de pago |
| 11 | pagos | Registro de pagos procesados |
| 12 | metodos_pago | Tarjetas y wallets registradas por clientes |
| 13 | cupones | Cupones de descuento creados por empresas y operadores |
| 14 | cupones_clientes | Asignación de cupones a clientes específicos |
| 15 | calificaciones | Reseñas y puntuaciones de servicios |
| 16 | reportes | Reportes de problemas enviados por usuarios |
| 17 | flota_vehiculos | Vehículos registrados por empresas de transporte |
| 18 | solicitudes_cambio_perfil | Solicitudes de modificación de perfil |
| 19 | notificaciones | Notificaciones del sistema |
| 20 | sesiones | Sesiones activas de usuarios |
| 21 | log_actividad | Registro de actividades del sistema |
| 22 | fotos_servicio | Fotografías de servicios de operadores |
| 23 | evidencias_reporte | Evidencias adjuntas a reportes |
| 24 | respuestas_calificacion | Respuestas de operadores a calificaciones |

## Conexión desde el Backend

La conexión a la base de datos se realiza mediante el paquete `pg` de Node.js configurado en `backend/config/db.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
```

</div>

---

<div align="center">

# 8. Comunicación Frontend-Backend

</div>

<div align="justify">

La comunicación entre el Frontend desarrollado en React y el Backend desarrollado en Node.js con Express se realiza mediante solicitudes HTTP utilizando la API nativa Fetch de JavaScript. Las solicitudes y respuestas se intercambian en formato JSON.

## Ejemplo de Solicitud desde el Frontend

```javascript
const res = await fetch("http://localhost:3000/api/empresa/cupones", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  },
  body: JSON.stringify({
    codigo: "VERANO2026",
    tipo_descuento: "porcentaje",
    valor_descuento: 10,
    fecha_inicio: "2026-06-19",
    fecha_fin: "2026-07-31"
  })
});
const data = await res.json();
```

## Implementación de CORS

Para permitir la comunicación entre el Frontend en el puerto 5173 y el Backend en el puerto 3000, se implementó el middleware CORS en `backend/index.js`:

```javascript
const cors = require("cors");
app.use(cors());
```

## Implementación de JWT

Para garantizar la seguridad del sistema se implementó autenticación mediante JSON Web Token. Al iniciar sesión exitosamente, el Backend genera un token que incluye el ID del usuario, su correo y su rol. Este token es almacenado en el `localStorage` del navegador y enviado en el encabezado `Authorization` de cada solicitud subsiguiente.

```javascript
const token = jwt.sign(
  { id: usuario.id, email: usuario.email, rol: usuario.rol },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);
```

El middleware de autenticación verifica el token en cada ruta protegida antes de permitir el acceso al controlador correspondiente.

## Estructura de Endpoints por Módulo

| Módulo | Prefijo de Ruta |
|--------|----------------|
| Autenticación | /api/auth |
| Administrador | /api/admin |
| Empresa | /api/empresa |
| Cliente | /api/cliente |
| Rutas de Transporte | /api/rutas |
| Carrito | /api/carrito |
| Pagos | /api/pagos |

</div>

---

<div align="center">

# 9. GitFlow

</div>

<div align="justify">

Durante el desarrollo de TrackFlow-HUB se utilizó la metodología GitFlow para organizar el trabajo colaborativo entre los integrantes del equipo. Esta estrategia permitió mantener un control adecuado de versiones, reducir conflictos durante la integración de cambios y facilitar el seguimiento del progreso del proyecto.

## Ramas Utilizadas

- **main:** Contiene las versiones estables y listas para entrega del proyecto. Solo recibe merges desde ramas de release.
- **develop:** Rama de integración donde se unifican las funcionalidades desarrolladas por todos los integrantes antes de ser incorporadas a main.
- **feature/descripcion_carnet:** Empleada para desarrollar funcionalidades específicas de manera aislada. Cada integrante crea su propia rama feature con su carnet incluido en el nombre.
- **release/vX.X.X:** Utilizada para preparar versiones previas a una entrega o presentación del proyecto.

## Convenciones de Nomenclatura

### Ramas

```
feature/descripcion-funcionalidad_carnet
```

Ejemplos:
- `feature/auth-ingreso-usuarios_202300378`
- `feature/modulo-empresa-cupones-perfil_202300572`
- `feature/nielsen-cliente_202307272`

### Commits (Conventional Commits)

```
tipo: descripción breve del cambio
```

Tipos utilizados:
- `feat:` Nueva funcionalidad
- `fix:` Corrección de error
- `test:` Pruebas unitarias o E2E
- `docs:` Documentación
- `refactor:` Refactorización de código

## Flujo de Trabajo Implementado

1. El integrante crea una rama feature desde develop.
2. Desarrolla la funcionalidad realizando commits descriptivos.
3. Una vez finalizada, hace merge a develop con la opción `--no-ff`.
4. Cuando se completa un conjunto de funcionalidades para un entregable, se crea una rama release.
5. La rama release es mergeada tanto a main como a develop.
6. Se crea un tag con el número de versión en main.

## Entregas y Versiones

| Versión | Fecha | Contenido |
|---------|-------|-----------|
| v1.0.0 | 17/06/2026 | Módulo de login, registro y administrador básico |
| v2.0.0 | 23/06/2026 | Módulo de operadores y empresas de transporte |
| v3.0.0 | 30/06/2026 | Módulo de clientes, administrador completo, UI/UX y CI/CD |

## Beneficios Obtenidos

- Mejor organización del trabajo colaborativo entre los 5 integrantes.
- Menor riesgo de afectar funcionalidades ya implementadas.
- Mayor facilidad para identificar errores y revertir cambios.
- Integración controlada de nuevas funcionalidades.
- Seguimiento claro del avance mediante ramas independientes por carnet.

</div>

---

<div align="center">

<div align="center">

# 10. Principios de Nielsen

</div>

<div align="justify">

Los principios heurísticos de Jakob Nielsen son un conjunto de reglas generales de usabilidad que sirven como guía para evaluar y mejorar el diseño de interfaces de usuario. En el desarrollo del módulo cliente de TrackFlow-HUB se aplicaron 8 de estos principios de manera concreta y verificable, con el objetivo de garantizar una experiencia de usuario intuitiva, eficiente y libre de errores.

---

## Principio 1: Visibilidad del Estado del Sistema

**Descripción del principio:** El sistema siempre debe mantener informados a los usuarios sobre lo que está ocurriendo, a través de retroalimentación apropiada en un tiempo razonable.

**Aplicación en TrackFlow-HUB:** Este principio se implementó mediante un spinner de carga que aparece en el centro de la pantalla cada vez que el sistema procesa una solicitud, deshabilitando los botones durante ese tiempo para evitar acciones duplicadas. Además, en la sección de Historial, cada reservación muestra un badge de color indicando su estado actual: verde para confirmado, azul para en tránsito, verde claro para entregado, rojo para cancelado y amarillo para pendiente.

<p align="center">
  <img src="principios/principio1.png" width="850">
</p>

<p align="center">
  <b>Figura 1.</b> Spinner de carga y badges de estado aplicando el principio de Visibilidad del Estado del Sistema.
</p>

---

## Principio 2: Prevención de Errores

**Descripción del principio:** Mejor que buenos mensajes de error es un diseño cuidadoso que prevenga que ocurran problemas en primer lugar. Se deben eliminar las condiciones propensas a errores o verificar con el usuario antes de que realice una acción.

**Aplicación en TrackFlow-HUB:** Antes de ejecutar cualquier acción irreversible, como eliminar un servicio del carrito, vaciar el carrito, confirmar un pago o cancelar una reservación, el sistema muestra un modal de confirmación que siempre incluye un botón Cancelar. Adicionalmente, el campo de fecha de viaje tiene configurada una fecha mínima de 24 horas para prevenir selecciones inválidas, y al agregar una tarjeta de pago el número es validado con el algoritmo de Luhn antes de enviarse al servidor.

<p align="center">
  <img src="principios/principio2.png" width="850">
</p>

<p align="center">
  <b>Figura 2.</b> Modal de confirmación aplicando el principio de Prevención de Errores.
</p>

---

## Principio 3: Reconocimiento antes que Memorización

**Descripción del principio:** Se debe minimizar la carga de memoria del usuario haciendo que los objetos, acciones y opciones sean visibles. El usuario no debería tener que recordar información de una parte de la interfaz a otra.

**Aplicación en TrackFlow-HUB:** La barra de navegación superior combina íconos PNG con etiquetas de texto descriptivo para cada sección, eliminando la necesidad de memorizar la ubicación de cada funcionalidad. La pantalla de Inicio muestra un grid con accesos directos a todas las secciones. Cuando una sección no tiene datos, se muestra un ícono representativo con un mensaje descriptivo que orienta al usuario sobre qué hace esa sección.

<p align="center">
  <img src="principios/principio3.png" width="850">
</p>

<p align="center">
  <b>Figura 3.</b> Navbar con íconos y texto descriptivo aplicando el principio de Reconocimiento antes que Memorización.
</p>

---

## Principio 4: Consistencia y Estándares

**Descripción del principio:** Los usuarios no deben tener que preguntarse si diferentes palabras, situaciones o acciones significan lo mismo. Se deben seguir las convenciones de la plataforma.

**Aplicación en TrackFlow-HUB:** Todo el módulo cliente utiliza la misma paleta de colores definida en variables CSS: `#2563EB` para botones de acción principal, `#0F172A` para títulos y `#F1F5F9` para fondos. Los botones de acción principal siempre tienen fondo azul, los secundarios fondo transparente con borde gris y los de acciones peligrosas color rojo. Todas las tarjetas del sistema siguen la misma estructura visual con fondo blanco, borde gris claro y border-radius de 12px definido con la variable `--radio`.

<p align="center">
  <img src="principios/principio4.png" width="850">
</p>

<p align="center">
  <b>Figura 4.</b> Paleta de colores y estilos consistentes aplicando el principio de Consistencia y Estándares.
</p>

---

## Principio 5: Ayuda al Usuario a Reconocer, Diagnosticar y Recuperarse de Errores

**Descripción del principio:** Los mensajes de error deben expresarse en lenguaje simple, indicar con precisión el problema y sugerir de manera constructiva una solución.

**Aplicación en TrackFlow-HUB:** El sistema reemplazó completamente el uso de `window.alert()` por alertas flotantes propias que aparecen en la esquina superior derecha con colores específicos según el tipo (verde para éxito, rojo para error, amarillo para advertencia) y desaparecen automáticamente. En el formulario de tarjeta, cada campo muestra mensajes de error específicos con borde rojo, por ejemplo: "Número de tarjeta inválido (verificación Luhn fallida)" o "Formato inválido. Usa MM/YYYY". Al intentar cancelar con menos de 24 horas de anticipación, el mensaje explica exactamente la política.

<p align="center">
  <img src="principios/principio5.png" width="850">
</p>

<p align="center">
  <b>Figura 5.</b> Alertas flotantes y validaciones inline aplicando el principio de Ayuda al Usuario a Recuperarse de Errores.
</p>

---

## Principio 6: Ayuda y Documentación

**Descripción del principio:** Aunque es mejor que el sistema pueda usarse sin documentación, puede ser necesario proporcionar ayuda y documentación orientada a la tarea del usuario.

**Aplicación en TrackFlow-HUB:** El módulo cliente incluye una sección de Ayuda accesible desde la barra de navegación en todo momento. Contiene un FAQ con las 6 preguntas más frecuentes presentadas en formato acordeón, donde el usuario puede expandir únicamente la pregunta que le interesa. Al final de la sección hay un botón que abre Gmail con un correo prellenado para contactar al equipo de soporte. En secciones clave se muestran mensajes informativos en azul que explican condiciones y restricciones, como la imposibilidad de modificar el correo electrónico desde el perfil.

<p align="center">
  <img src="principios/principio6.png" width="850">
</p>

<p align="center">
  <b>Figura 6.</b> Centro de Ayuda con FAQ en acordeón aplicando el principio de Ayuda y Documentación.
</p>

---

## Principio 7: Control y Libertad del Usuario

**Descripción del principio:** Los usuarios necesitan una salida de emergencia claramente marcada para abandonar el estado no deseado sin tener que pasar por un diálogo extendido.

**Aplicación en TrackFlow-HUB:** Cada modal de confirmación incluye siempre un botón Cancelar prominente que cierra el modal y regresa al usuario al estado anterior sin realizar ningún cambio. Los clientes pueden cancelar reservaciones activas desde el Historial dentro de las condiciones de la política de cancelación. El usuario puede navegar libremente entre cualquier sección del sistema en cualquier momento usando la barra de navegación superior, sin necesidad de completar un flujo específico.

<p align="center">
  <img src="principios/principio7.png" width="850">
</p>

<p align="center">
  <b>Figura 7.</b> Botón Cancelar en modales aplicando el principio de Control y Libertad del Usuario.
</p>

---

## Principio 8: Diseño Estético y Minimalista

**Descripción del principio:** Los diálogos no deben contener información irrelevante o raramente necesaria. Cada unidad extra de información compite con las unidades relevantes y disminuye su visibilidad.

**Aplicación en TrackFlow-HUB:** En lugar de mostrar toda la información en una sola página, el contenido está organizado en secciones independientes donde cada una muestra únicamente la información relevante para esa función. Cuando una sección no tiene datos se muestra un ícono simple con un mensaje breve. Cada tarjeta muestra los datos más importantes con tipografía grande y negrita, y los datos secundarios con tipografía pequeña en gris. Se utiliza únicamente la paleta de colores definida en las variables CSS del proyecto.

<p align="center">
  <img src="principios/principio8.png" width="850">
</p>

<p align="center">
  <b>Figura 8.</b> Diseño minimalista y organizado aplicando el principio de Diseño Estético y Minimalista.
</p>

---

## Resumen de Principios Aplicados

| N° | Principio | Implementación Principal |
|----|-----------|--------------------------|
| 1 | Visibilidad del Estado del Sistema | Spinner de carga y badges de estado con colores en el historial de reservaciones |
| 2 | Prevención de Errores | Modales de confirmación, validación de fecha mínima y algoritmo de Luhn |
| 3 | Reconocimiento antes que Memorización | Navbar con íconos PNG y texto descriptivo, grid de accesos directos en el inicio |
| 4 | Consistencia y Estándares | Paleta de colores en variables CSS, estilos de botones uniformes y estructura de tarjetas consistente |
| 5 | Ayuda al Usuario a Recuperarse de Errores | Alertas flotantes reemplazando window.alert y validaciones inline en formularios |
| 6 | Ayuda y Documentación | Centro de Ayuda con FAQ en formato acordeón y acceso directo a soporte por correo |
| 7 | Control y Libertad del Usuario | Botón Cancelar en todos los modales y posibilidad de cancelar reservaciones |
| 8 | Diseño Estético y Minimalista | Vistas separadas por sección, estados vacíos limpios y jerarquía visual clara |

</div>
---

<div align="center">

# 11. Pruebas Realizadas

</div>

<div align="justify">

Durante el desarrollo del sistema se realizaron pruebas unitarias y pruebas End-to-End para verificar el correcto funcionamiento de los módulos implementados.

## 11.1 Pruebas Unitarias

Las pruebas unitarias fueron desarrolladas usando Jest y se encuentran en la carpeta `pruebas/unitarias/`. Cada integrante desarrolló mínimo 2 pruebas unitarias para los controladores de su módulo asignado.

### Pruebas del Módulo Empresa 

**Prueba 1: obtenerPerfil**

Verifica que la función `obtenerPerfil` del controlador de empresa retorne correctamente el perfil cuando se le proporciona un ID de empresa válido.

```javascript
test('Debería retornar el perfil de empresa exitosamente - 202300378', async () => {
  const perfilMock = { nombre_empresa: 'Transporte Test' };
  db.pool.query.mockResolvedValueOnce({ rows: [perfilMock] });

  await obtenerPerfil(req, res);

  expect(res.json).toHaveBeenCalledWith({
    success: true,
    data: perfilMock
  });
});
```

**Prueba 2: listarCupones**

Verifica que la función `listarCupones` retorne correctamente la lista de cupones asociados a una empresa.

```javascript
test('Debería listar cupones de la empresa exitosamente - 202300378', async () => {
  const cuponesMock = [{ id: '1', codigo: 'DESC10' }];
  db.pool.query.mockResolvedValueOnce({ rows: cuponesMock });

  await listarCupones(req, res);

  expect(res.json).toHaveBeenCalledWith({
    success: true,
    data: cuponesMock
  });
});
```

### Ejecutar Pruebas Unitarias

```bash
cd pruebas
npm test
```

## 11.2 Pruebas End-to-End

Las pruebas E2E fueron desarrolladas usando Playwright y se encuentran en la carpeta `pruebas/E2E/`. Verifican flujos completos de interacción del usuario con la interfaz.

### Prueba E2E del Módulo Empresa - Gestión de Cupones

Verifica que una empresa pueda iniciar sesión y acceder a la sección de gestión de cupones correctamente.

```javascript
test('Debe iniciar sesión como empresa y mostrar la sección de cupones', async ({ page }) => {
  await loginComoEmpresa(page, EMAIL, PASSWORD);
  await expect(page.locator('text=TrackFlow-HUB')).toBeVisible({ timeout: 15000 });
  await page.locator('text=Gestión de Cupones').click();
  await page.waitForTimeout(1000);
  const couponsHeader = page.locator('text=Crear Cupón')
    .or(page.locator('text=Mis Cupones'))
    .or(page.locator('text=Código'));
  await expect(couponsHeader.first()).toBeVisible({ timeout: 10000 });
});
```

### Ejecutar Pruebas E2E

```bash
cd pruebas
npx playwright test
```

## 11.3 Resultados de Pruebas

Las pruebas realizadas verificaron el correcto funcionamiento de los principales módulos implementados. Los controladores de empresa, incluyendo obtención de perfil, listado de cupones, creación de cupones y gestión de flota, pasaron exitosamente todas las pruebas unitarias. Las pruebas E2E confirmaron que los flujos de navegación e interacción de la interfaz funcionan correctamente desde la perspectiva del usuario.

</div>

---

<div align="center">

# 12. Problemas Encontrados y Soluciones Aplicadas

</div>

<div align="justify">

Durante el desarrollo del proyecto se presentaron algunos inconvenientes técnicos. A continuación se describen los principales problemas y la forma en que fueron solucionados.

---

## Problema 1: Valores de Enums Incorrectos

### Descripción

Al implementar operaciones de actualización en la base de datos, el sistema retornaba errores 500 indicando valores inválidos para los tipos enum de PostgreSQL. Por ejemplo, al intentar desactivar un cupón se usaba el valor `inactivo` cuando el enum `coupon_status` solo acepta `activo`, `expirado` y `agotado`.

### Solución

Se consultó el enum directamente en la base de datos para verificar los valores válidos:

```bash
docker exec -it trackflow-db psql -U admin -d trackflow_db -c "SELECT enum_range(NULL::coupon_status);"
```

Se actualizaron todos los valores de enum en los controladores para que coincidieran exactamente con los definidos en el schema de la base de datos.

### Resultado

Las operaciones de actualización funcionaron correctamente después de corregir los valores de enum.

---

## Problema 2: useState dentro de map() en React

### Descripción

Al renderizar las tarjetas de rutas de transporte, el sistema mostraba una pantalla en blanco con el error `Invalid hook call`. Esto ocurrió porque se intentó usar el hook `useState` dentro de la función de callback del método `.map()`, lo cual viola las reglas de hooks de React.

### Solución

Se extrajo el componente de cada tarjeta a una función de componente independiente llamada `RutaCard`, que puede usar hooks correctamente:

```jsx
function RutaCard({ ruta, onAgregar, cargando }) {
  const [fecha, setFecha] = useState("");
  return (
    // JSX de la tarjeta
  );
}
```

### Resultado

Las tarjetas de rutas se renderizan correctamente con su propio estado de fecha independiente.

---

## Problema 3: Conflictos de Merge en develop

### Descripción

Al hacer pull de la rama develop después de que un compañero subió cambios, se generaron conflictos en archivos como `DashboardCliente.jsx` que fueron modificados por múltiples integrantes simultáneamente.

### Solución

Se utilizó `git merge --abort` para cancelar el merge conflictivo, luego `git fetch origin` para actualizar las referencias remotas y finalmente `git reset --hard origin/develop` para sincronizar la rama local con el estado remoto:

```bash
git merge --abort
git fetch origin
git reset --hard origin/develop
```

### Resultado

La rama local quedó sincronizada con develop remoto sin pérdida de información.

---

## Problema 4: Token JWT Expirado

### Descripción

Al probar el sistema después de varias horas sin actividad, las peticiones al Backend retornaban error 401 con el mensaje "Token inválido o expirado". Esto ocurría porque el token tiene una duración de 8 horas.

### Solución

El sistema maneja esta situación mostrando mensajes de error claros al usuario. La solución es cerrar sesión y volver a iniciar sesión para obtener un nuevo token. Se configuró la duración del token en las variables de entorno para facilitar su ajuste.

### Resultado

El sistema funciona correctamente dentro del período de validez del token y el usuario recibe mensajes claros cuando necesita volver a autenticarse.

</div>

---

<div align="center">

# 13. Conclusiones

</div>

<div align="justify">

Durante el desarrollo del sistema TrackFlow-HUB el equipo logró implementar una solución web integral orientada a la gestión de envíos y servicios logísticos, aplicando buenas prácticas de desarrollo de software, trabajo colaborativo y organización de proyectos.

- El uso de **React con Vite** permitió desarrollar una interfaz dinámica y modular mediante componentes reutilizables, facilitando el mantenimiento y la escalabilidad del sistema.

- La implementación de **Node.js con Express.js** proporcionó una API REST bien estructurada y eficiente para manejar las solicitudes de los cuatro tipos de usuarios del sistema.

- La utilización de **PostgreSQL 15 con Docker** garantizó un entorno de base de datos consistente para todos los integrantes del equipo y simplificó la configuración inicial del proyecto.

- El uso de **Git y GitFlow** con convenciones de Conventional Commits facilitó el trabajo colaborativo entre los 5 integrantes del equipo, permitiendo desarrollar funcionalidades de forma paralela y mantener un control adecuado de versiones.

- La integración de **pruebas unitarias con Jest y pruebas E2E con Playwright** permitió verificar el correcto funcionamiento de los módulos desarrollados y detectar errores de manera temprana.

- La aplicación de los **principios heurísticos de Nielsen** mejoró significativamente la experiencia de usuario, reemplazando alertas nativas del navegador por un sistema de notificaciones propio, agregando modales de confirmación y organizando la interfaz con íconos y navegación clara.

- El proyecto permitió reforzar conocimientos relacionados con desarrollo Full Stack, bases de datos relacionales, control de versiones, diseño de interfaces y metodologías de trabajo colaborativo.

En conclusión, TrackFlow-HUB cumple con los requerimientos planteados para la gestión de envíos y servicios logísticos, proporcionando una base sólida para futuras mejoras e integraciones como el despliegue en la nube y la implementación de CI/CD.

</div>

---

<div align="center">

# 14. Anexos

</div>

<div align="justify">

En esta sección se presentan los diagramas y artefactos elaborados durante las etapas de análisis, diseño e implementación del sistema TrackFlow-HUB.

---

## 14.1 Diagramas de Secuencia

Los diagramas de secuencia representan el intercambio de mensajes entre los componentes del sistema durante la ejecución de los procesos principales de cada módulo. Muestran la interacción entre el usuario, el Frontend (React), el Backend (Node.js), la Base de Datos (PostgreSQL) y el Servicio de Correo.

<div align="center">

![Secuencia Autenticación](/Documentación/DiagramaSecuencia-ModuloAutenticación.drawio.png)

**Figura 1. Diagrama de secuencia del módulo de autenticación — Inicio de sesión con JWT y 2FA.**

</div>

<div align="center">

![Secuencia Administrador](/Documentación/DiagramaSecuenica-Administrador.drawio.png)

**Figura 2. Diagrama de secuencia del módulo administrador — Aprobación y rechazo de solicitudes.**

</div>

<div align="center">

![Secuencia Empresa](/Documentación/DiagramaSecuencia-Empresa.drawio.png)

**Figura 3. Diagrama de secuencia del módulo empresa de transporte — Creación y envío de cupones.**

</div>

<div align="center">

![Secuencia Operador](/Documentación/DiagramaSecuencia-Operador.drawio.png)

**Figura 4. Diagrama de secuencia del módulo operador logístico — Gestión de servicios.**

</div>

<div align="center">

![Secuencia Cliente](/Documentación/DiagramaSecuencia-Cliente.drawio.png)

**Figura 5. Diagrama de secuencia del módulo cliente — Carrito, pago con cupón y cancelación.**

</div>

---

## 14.2 Diagrama de Clases

El diagrama de clases presenta la estructura principal del sistema, mostrando las entidades, atributos y relaciones utilizadas durante el desarrollo. Representa la organización lógica de los modelos de datos y sus interacciones dentro de la arquitectura del sistema.

<div align="center">

![Diagrama de Clases](/Documentación/Diagrama-de-Clases.png)

**Figura 6. Diagrama de clases del sistema TrackFlow-HUB.**

</div>

---

## 14.3 Casos de Uso

Los diagramas de casos de uso representan las principales funcionalidades identificadas durante el análisis de requerimientos del sistema, mostrando la interacción entre los actores y el sistema para cada proceso principal.

<div align="center">

![Caso de Uso General](/Documentación/Diagramas/Diagrama-CU-General.jpg)

**Figura 7. Diagrama de casos de uso general del sistema TrackFlow-HUB.**

</div>

<div align="center">

![Caso de Uso 1](/Documentación/Diagramas/Diagrama-CU-1.jpg)

**Figura 8. Diagrama de caso de uso 1.**

</div>

<div align="center">

![Caso de Uso 2](/Documentación/Diagramas/Diagrama-CU-2.jpg)

**Figura 9. Diagrama de caso de uso 2.**

</div>

<div align="center">

![Caso de Uso 3](/Documentación/Diagramas/Diagrama-CU-3.jpg)

**Figura 10. Diagrama de caso de uso 3.**

</div>

<div align="center">

![Caso de Uso 4](/Documentación/Diagramas/Diagrama-CU-4.jpg)

**Figura 11. Diagrama de caso de uso 4.**

</div>

---

# Requerimientos del Sistema TrackFlow-HUB

A continuación se presentan los requerimientos funcionales y no funcionales identificados para la plataforma de Gestión de Envíos y Logística **TrackFlow-HUB**.

---

# Requerimientos Funcionales

Los requerimientos funcionales describen las acciones, procesos y servicios que el sistema debe proporcionar a los clientes, operadores logísticos, empresas de transporte y administradores.

| Código | Requerimiento | Descripción |
|----------|----------|----------|
| RF-01 | Registro de Clientes | El sistema permitirá el registro de clientes solicitando obligatoriamente nombre, apellido, teléfono, correo electrónico, contraseña y una dirección de origen predeterminada. |
| RF-02 | Registro de Operadores Logísticos | El sistema registrará operadores logísticos solicitando nombre, apellido, DPI/CUI, teléfono, correo electrónico, fotografía, zona de operación y género. |
| RF-03 | Registro de Empresas de Transporte | El sistema registrará empresas de transporte solicitando el nombre de la empresa, teléfono, correo electrónico, NIT y número de licencia operativa. |
| RF-04 | Verificación de Correo Electrónico | El sistema enviará un token único de 6 caracteres al correo registrado para que los clientes, operadores y empresas verifiquen su cuenta. |
| RF-05 | Ingreso de Usuarios | El sistema permitirá el inicio de sesión para usuarios verificados, requiriendo para operadores y empresas la aceptación previa del administrador. |
| RF-06 | Autenticación de Dos Factores (2FA) | El sistema solicitará al administrador, además de su contraseña, un token de verificación enviado por correo electrónico con vigencia de 2 minutos durante el inicio de sesión. |
| RF-07 | Gestión de Aprobaciones | El administrador podrá aceptar o rechazar solicitudes de registro de operadores logísticos y agendar reuniones virtuales para aprobar a las empresas de transporte. |
| RF-08 | Gestión de Usuarios | El administrador podrá visualizar, filtrar por rol, editar o vetar usuarios del sistema, exigiendo ingresar un motivo que será notificado al usuario por correo. |
| RF-09 | Gestión de Reportes de Moderación | El administrador podrá revisar, cambiar el estado (Enviado, En revisión, Aceptado, Rechazado) de los reportes generados y aplicar sanciones a los usuarios infractores. |
| RF-10 | Visualización y Descarga de Reportes | El administrador visualizará detalles de servicios y envíos, y podrá descargar reportes en PDF con gráficas de usuarios, ingresos, rutas, envíos y logs de registro. |
| RF-11 | Gestión de Servicios Logísticos | El operador logístico podrá registrar, modificar, suspender temporalmente o eliminar servicios de envío, detallando zona, capacidad, precio y fotografías. |
| RF-12 | Gestión de Rutas y Flota | Las empresas de transporte podrán cargar rutas manualmente o de forma masiva en CSV, así como editarlas o suspenderlas notificando a los clientes afectados. |
| RF-13 | Búsqueda y Filtrado de Servicios | El cliente podrá buscar y filtrar servicios de envío y transporte por zona, destino, calificación, precio, empresa o capacidad de carga. |
| RF-14 | Programación de Reservaciones | El cliente podrá programar envíos o transporte con al menos 24 horas de anticipación y visualizará sugerencias cruzadas de servicios complementarios. |
| RF-15 | Gestión de Pagos | El sistema procesará pagos desde un carrito persistente utilizando una tarjeta de crédito simulada con saldo inicial, o un método alternativo para confirmar la reservación. |
| RF-16 | Calificaciones y Reseñas | Los clientes podrán puntuar y comentar los servicios finalizados, y los operadores podrán visualizar y responder a estas reseñas. |
| RF-17 | Sistema de Reportes entre Usuarios | Los clientes podrán reportar problemas con los servicios adjuntando evidencias, y los operadores podrán reportar a clientes que infrinjan las condiciones del servicio. |
| RF-18 | Gestión de Cupones | Los operadores y empresas de transporte podrán generar cupones de descuento por temporada que los clientes podrán canjear. |
| RF-19 | Edición de Perfiles | Los clientes podrán editar su perfil directamente, mientras que los operadores y empresas de transporte deberán solicitar los cambios para que sean aprobados por el administrador.
| RF-20 | Reportes de Proveedores | Los operadores y empresas de transporte podrán generar reportes en PDF de sus ganancias, historial de servicios, estado de rutas y calificaciones recibidas.
| RF-21 | Vista de Calendario para Operadores | El sistema permitirá a los operadores logísticos visualizar en formato de calendario las fechas de los envíos programados por los clientes, tanto por servicio individual como a nivel general. |
| RF-22 | Visualización Detallada para Administrador | El sistema permitirá al administrador visualizar los servicios de transporte ordenados por zona geográfica y empresa, así como los envíos registrados ordenados por destino y operador. |
| RF-23 | Distribución de Ganancias | El sistema deberá calcular automáticamente la distribución de ganancias: 80% para el operador logístico (20% para la plataforma) y 90% para la empresa de transporte (10% para la plataforma). |
| RF-24 | Persistencia del Carrito de Compras | El sistema mantendrá los servicios agregados en el carrito de compras del cliente de forma persistente, conservando la información incluso si el usuario cierra su sesión. |
| RF-25 | Cancelación de Reservaciones | El sistema permitirá al cliente cancelar una reservación de servicio siempre y cuando lo haga con al menos 24 horas de anticipación a la fecha programada. |


---


# Requerimientos No Funcionales

Los requerimientos no funcionales describen restricciones, características de calidad y condiciones técnicas que debe cumplir el sistema.

| Código | Requerimiento | Descripción |
|----------|----------|----------|
| RNF-01 | Seguridad de Contraseñas | El sistema deberá requerir contraseñas seguras, las cuales deberán ser confirmadas dos veces obligatoriamente por todos los usuarios al momento del registro. |
| RNF-02 | Arquitectura de Contenedores | El sistema deberá estar contenerizado utilizando Docker tanto para el entorno del backend como del frontend, garantizando su consistencia y despliegue en la nube o máquina virtual. |
| RNF-03 | Integración y Despliegue Continuo (CI/CD) | El sistema deberá contar con un pipeline automatizado en GitHub Actions con etapas de Build, Test y Deploy, el cual se ejecutará únicamente al realizar un push a la rama main. |
| RNF-04 | Pruebas Unitarias | El código backend deberá incluir un mínimo de 10 pruebas unitarias para validar el funcionamiento individual de los componentes (mínimo 2 por integrante). |
| RNF-05 | Pruebas End-to-End (E2E) | El sistema deberá incorporar un mínimo de 10 pruebas E2E diferentes utilizando herramientas como Selenium o Playwright para simular los flujos críticos del usuario. |
| RNF-06 | Validación del Método de Pago | El sistema deberá implementar manualmente el algoritmo de Luhn para validar los números de las tarjetas de crédito o débito ingresadas en las compras simuladas. |
| RNF-07 | Usabilidad (UI/UX) | La interfaz de usuario deberá aplicar e integrar de manera evidente al menos 6 de los 10 principios heurísticos de diseño de Jakob Nielsen. |
| RNF-08 | Restricciones de Diseño Frontend | El diseño de las interfaces no deberá utilizar el framework Bootstrap ni emplear plantillas prefabricadas descargadas que carezcan de personalización. |
| RNF-09 | Metodología y Versionamiento | El proyecto deberá gestionarse bajo el marco de trabajo Scrum utilizando un tablero Kanban y controlarse en GitHub mediante la estrategia Gitflow y Conventional Commits. |
| RNF-10 | Formato de Documentación | Toda la documentación generada deberá redactarse en formato Markdown y alojarse obligatoriamente dentro de la carpeta "Proyecto/documentacion" en el repositorio. |
| RNF-11 | Infraestructura de Base de Datos | El sistema deberá utilizar una base de datos relacional alojada en la nube, o en su defecto, esta deberá estar dockerizada junto con el resto de la aplicación. |
| RNF-12 | Elección de Stack Tecnológico | El desarrollo del frontend y backend quedará a libre elección del grupo, pudiendo utilizar cualquier lenguaje, framework y librerías siempre que se justifique técnicamente. |
| RNF-13 | Nomenclatura de Ramas en Repositorio | Cada integrante del equipo deberá crear y trabajar en al menos una rama con la nomenclatura obligatoria "feature/funcion_carnet" para cada entregable. |
| RNF-14 | Versionamiento Semántico | El repositorio deberá contar con al menos 3 releases hacia la rama main, utilizando versionamiento semántico que culmine en la versión final con el tag v3.0.0. |
| RNF-15 | Estructura del Tablero Kanban | La herramienta de gestión de proyectos utilizada deberá mantener un tablero actualizado que incluya las columnas: Por hacer, En proceso y Realizado. |


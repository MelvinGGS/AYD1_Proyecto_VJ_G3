# Requerimientos del Sistema TrackFlow-HUB

A continuacion se presentan los requerimientos funcionales y no funcionales identificados para la plataforma de Gestion de Envios y Logistica **TrackFlow-HUB**.

---

# Requerimientos Funcionales

Los requerimientos funcionales describen las acciones, procesos y servicios que el sistema debe proporcionar a los clientes, operadores logisticos, empresas de transporte y administradores.

| Codigo | Prioridad | Requerimiento | Descripcion |
|----------|----------|----------|----------|
| RF-01 | Alta | Registro de Clientes | El sistema permitira el registro de clientes solicitando obligatoriamente nombre, apellido, telefono, correo electronico, contrasena y una direccion de origen predeterminada. |
| RF-02 | Alta | Registro de Operadores Logisticos | El sistema registrara operadores logisticos solicitando nombre, apellido, DPI/CUI, telefono, correo electronico, fotografia, zona de operacion y genero. |
| RF-03 | Alta | Registro de Empresas de Transporte | El sistema registrara empresas de transporte solicitando el nombre de la empresa, telefono, correo electronico, NIT y numero de licencia operativa. |
| RF-04 | Alta | Verificacion de Correo Electronico | El sistema enviara un token unico de 6 caracteres al correo registrado para que los clientes, operadores y empresas verifiquen su cuenta. |
| RF-05 | Alta | Ingreso de Usuarios | El sistema permitira el inicio de sesion para usuarios verificados, requiriendo para operadores y empresas la aceptacion previa del administrador. |
| RF-06 | Alta | Autenticacion de Dos Factores (2FA) | El sistema solicitara al administrador, ademas de su contrasena, un token de verificacion enviado por correo electronico con vigencia de 2 minutos durante el inicio de sesion. |
| RF-07 | Alta | Gestion de Aprobaciones | El administrador podra aceptar o rechazar solicitudes de registro de operadores logisticos y agendar reuniones virtuales para aprobar a las empresas de transporte. |
| RF-08 | Alta | Gestion de Servicios Logisticos | El operador logistico podra registrar, modificar, suspender temporalmente o eliminar servicios de envio, detallando zona, capacidad, precio y fotografias. |
| RF-09 | Alta | Gestion de Rutas y Flota | Las empresas de transporte podran cargar rutas manualmente o de forma masiva en CSV, asi como editarlas o suspenderlas notificando a los clientes afectados. |
| RF-10 | Alta | Gestion de Pagos | El sistema procesara pagos desde un carrito persistente utilizando una tarjeta de credito simulada con saldo inicial, o un metodo alternativo para confirmar la reservacion. |
| RF-11 | Alta | Distribucion de Ganancias | El sistema debera calcular automaticamente la distribucion de ganancias: 80% para el operador logistico (20% para la plataforma) y 90% para la empresa de transporte (10% para la plataforma). |
| RF-12 | Media | Gestion de Usuarios | El administrador podra visualizar, filtrar por rol, editar o vetar usuarios del sistema, exigiendo ingresar un motivo que sera notificado al usuario por correo. |
| RF-13 | Media | Gestion de Reportes de Moderacion | El administrador podra revisar, cambiar el estado (Enviado, En revision, Aceptado, Rechazado) de los reportes generados y aplicar sanciones a los usuarios infractores. |
| RF-14 | Media | Busqueda y Filtrado de Servicios | El cliente podra buscar y filtrar servicios de envio y transporte por zona, destino, calificacion, precio, empresa o capacidad de carga. |
| RF-15 | Media | Programacion de Reservaciones | El cliente podra programar envios o transporte con al menos 24 horas de anticipacion y visualizara sugerencias cruzadas de servicios complementarios. |
| RF-16 | Media | Calificaciones y Resenas | Los clientes podran puntuar y comentar los servicios finalizados, y los operadores podran visualizar y responder a estas resenas. |
| RF-17 | Media | Gestion de Cupones | Los operadores y empresas de transporte podran generar cupones de descuento por temporada que los clientes podran canjear. |
| RF-18 | Media | Edicion de Perfiles | Los clientes podran editar su perfil directamente, mientras que los operadores y empresas de transporte deberan solicitar los cambios para que sean aprobados por el administrador. |
| RF-19 | Media | Reportes de Proveedores | Los operadores y empresas de transporte podran generar reportes en PDF de sus ganancias, historial de servicios, estado de rutas y calificaciones recibidas. |
| RF-20 | Media | Vista de Calendario para Operadores | El sistema permitira a los operadores logisticos visualizar en formato de calendario las fechas de los envios programados por los clientes, tanto por servicio individual como a nivel general. |
| RF-21 | Media | Visualizacion y Descarga de Reportes | El administrador visualizara detalles de servicios y envios, y podra descargar reportes en PDF con graficas de usuarios, ingresos, rutas, envios y logs de registro. |
| RF-22 | Baja | Sistema de Reportes entre Usuarios | Los clientes podran reportar problemas con los servicios adjuntando evidencias, y los operadores podran reportar a clientes que infrinjan las condiciones del servicio. |
| RF-23 | Baja | Visualizacion Detallada para Administrador | El sistema permitira al administrador visualizar los servicios de transporte ordenados por zona geografica y empresa, asi como los envios registrados ordenados por destino y operador. |
| RF-24 | Baja | Persistencia del Carrito de Compras | El sistema mantendra los servicios agregados en el carrito de compras del cliente de forma persistente, conservando la informacion incluso si el usuario cierra su sesion. |
| RF-25 | Baja | Cancelacion de Reservaciones | El sistema permitira al cliente cancelar una reservacion de servicio siempre y cuando lo haga con al menos 24 horas de anticipacion a la fecha programada. |


---


# Requerimientos No Funcionales

Los requerimientos no funcionales describen restricciones, caracteristicas de calidad y condiciones tecnicas que debe cumplir el sistema.

| Codigo | Prioridad | Requerimiento | Descripcion |
|----------|----------|----------|----------|
| RNF-01 | Alta | Seguridad de Contrasenas | El sistema debera requerir contrasenas seguras, las cuales deberan ser confirmadas dos veces obligatoriamente por todos los usuarios al momento del registro. |
| RNF-02 | Alta | Arquitectura de Contenedores | El sistema debera estar contenerizado utilizando Docker tanto para el entorno del backend como del frontend, garantizando su consistencia y despliegue en la nube o maquina virtual. |
| RNF-03 | Alta | Integracion y Despliegue Continuo (CI/CD) | El sistema debera contar con un pipeline automatizado en GitHub Actions con etapas de Build, Test y Deploy, el cual se ejecutara unicamente al realizar un push a la rama main. |
| RNF-04 | Alta | Pruebas Unitarias | El codigo backend debera incluir un minimo de 10 pruebas unitarias para validar el funcionamiento individual de los componentes (minimo 2 por integrante). |
| RNF-05 | Alta | Pruebas End-to-End (E2E) | El sistema debera incorporar un minimo de 10 pruebas E2E diferentes utilizando herramientas como Selenium o Playwright para simular los flujos criticos del usuario. |
| RNF-06 | Alta | Metodologia y Versionamiento | El proyecto debera gestionarse bajo el marco de trabajo Scrum utilizando un tablero Kanban y controlarse en GitHub mediante la estrategia Gitflow y Conventional Commits. |
| RNF-07 | Alta | Nomenclatura de Ramas en Repositorio | Cada integrante del equipo debera crear y trabajar en al menos una rama con la nomenclatura obligatoria "feature/funcion_carnet" para cada entregable. |
| RNF-08 | Media | Validacion del Metodo de Pago | El sistema debera implementar manualmente el algoritmo de Luhn para validar los numeros de las tarjetas de credito o debito ingresadas en las compras simuladas. |
| RNF-09 | Media | Usabilidad (UI/UX) | La interfaz de usuario debera aplicar e integrar de manera evidente al menos 6 de los 10 principios heuristicos de diseno de Jakob Nielsen. |
| RNF-10 | Media | Infraestructura de Base de Datos | El sistema debera utilizar una base de datos relacional alojada en la nube, o en su defecto, esta debera estar dockerizada junto con el resto de la aplicacion. |
| RNF-11 | Media | Formato de Documentacion | Toda la documentacion generada debera redactarse en formato Markdown y alojarse obligatoriamente dentro de la carpeta "Proyecto/documentacion" en el repositorio. |
| RNF-12 | Media | Versionamiento Semantico | El repositorio debera contar con al menos 3 releases hacia la rama main, utilizando versionamiento semantico que culmine en la version final con el tag v3.0.0. |
| RNF-13 | Baja | Restricciones de Diseno Frontend | El diseno de las interfaces no debera utilizar el framework Bootstrap ni emplear plantillas prefabricadas descargadas que carezcan de personalizacion. |
| RNF-14 | Baja | Eleccion de Stack Tecnologico | El desarrollo del frontend y backend quedara a libre eleccion del grupo, pudiendo utilizar cualquier lenguaje, framework y librerias siempre que se justifique tecnicamente. |
| RNF-15 | Baja | Estructura del Tablero Kanban | La herramienta de gestion de proyectos utilizada debera mantener un tablero actualizado que incluya las columnas: Por hacer, En proceso y Realizado. |

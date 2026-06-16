# Historias de Usuario

Universidad de San Carlos de Guatemala

Facultad de Ingeniería

Análisis y Diseño de Sistemas 1

**Grupo 3**

---

## Módulo de Autenticación y Registro

### HU-001 Registro de Cliente
**Como:** visitante de la plataforma

**Quiero:** crear una cuenta como cliente proporcionando mis datos

**Para:** poder buscar, reservar y gestionar envíos y transportes.

#### Criterios de Aceptación
- El sistema debe solicitar obligatoriamente nombre, apellido, teléfono, correo electrónico, contraseña y dirección de origen predeterminada.
- La contraseña debe ser confirmada dos veces por el usuario.
- El sistema debe generar mensajes de error si algún campo obligatorio está vacío.

**Prioridad:** Alta

**Story Points:** 5

---

### HU-002 Registro de Operador Logístico
**Como:** proveedor de servicios de envío

**Quiero:** registrarme como operador logístico

**Para:** poder ofrecer mis servicios dentro de la plataforma.

#### Criterios de Aceptación
- El sistema debe solicitar obligatoriamente nombre, apellido, DPI/CUI, teléfono, correo electrónico, fotografía, zona de operación y género.
- El teléfono de respaldo debe ser un campo opcional.
- Al finalizar, el operador debe recibir una notificación de que su cuenta requiere aprobación administrativa.

**Prioridad:** Alta

**Story Points:** 5

---

### HU-003 Registro de Empresa de Transporte
**Como:** representante de una empresa de transporte

**Quiero:** registrar el perfil de la empresa en el sistema

**Para:** administrar rutas y proveer servicios de transporte a los clientes.

#### Criterios de Aceptación
- El sistema debe solicitar obligatoriamente nombre de la empresa, teléfono, correo electrónico, NIT y número de licencia operativa.
- El perfil debe quedar en estado pendiente hasta que se concrete una reunión con el administrador.

**Prioridad:** Alta

**Story Points:** 5

---

### HU-004 Verificación de Correo Electrónico
**Como:** nuevo usuario de la plataforma (Cliente, Operador o Empresa)

**Quiero:** verificar mi dirección de correo electrónico

**Para:** garantizar la autenticidad de mi cuenta y poder iniciar sesión.


#### Criterios de Aceptación
- El sistema debe enviar un token único de 6 caracteres al correo registrado.
- El sistema debe requerir este token inmediatamente después del registro o en cualquier intento de inicio de sesión si la cuenta no ha sido verificada.

**Prioridad:** Alta

**Story Points:** 5

---

### HU-005 Inicio de Sesión de Administrador con 2FA
**Como:** administrador del sistema

**Quiero:** iniciar sesión utilizando autenticación de dos factores

**Para:** mantener la máxima seguridad en el acceso al panel administrativo.

#### Criterios de Aceptación
- El administrador debe ingresar su contraseña y un token enviado al correo para completar el inicio de sesión.
- El sistema debe enviar un token al correo electrónico del administrador con vigencia de 2 minutos.

**Prioridad:** Alta

**Story Points:** 8

---

## Módulo de Administrador

### HU-006 Aprobación de Operadores Logísticos
**Como:** administrador

**Quiero:** revisar las solicitudes de nuevos operadores logísticos

**Para:** aceptar o rechazar su ingreso a la plataforma.

#### Criterios de Aceptación
- El administrador debe poder aceptar o rechazar las solicitudes de registro de operadores logísticos.
- El sistema debe notificar al operador logístico sobre la decisión por correo electrónico.

**Prioridad:** Alta

**Story Points:** 3

---

### HU-007 Agendamiento de Reuniones con Empresas
**Como:** administrador

**Quiero:** agendar una reunión virtual con empresas de transporte pendientes de aprobación

**Para:** evaluar su propuesta y validar sus servicios.

#### Criterios de Aceptación
- El administrador debe poder agendar una reunión virtual con las empresas de transporte.
- El administrador debe enviar la fecha, hora y enlace de la reunión al correo de la empresa.

**Prioridad:** Media

**Story Points:** 5

---

### HU-008 Veto de Usuarios
**Como:** administrador

**Quiero:** deshabilitar o vetar el acceso de usuarios a la plataforma

**Para:** sancionar a aquellos que infrinjan las normativas de TrackFlow-HUB.

#### Criterios de Aceptación
- El administrador debe poder vetar usuarios de la plataforma.
- El sistema debe exigir que el administrador ingrese un motivo para el veto.
- El usuario vetado debe recibir una notificación por correo indicando la razón.

**Prioridad:** Media

**Story Points:** 5

---

### HU-009 Aprobación de Cambios en Perfiles
**Como:** administrador

**Quiero:** revisar las solicitudes de cambio de información de los proveedores

**Para:** verificar los nuevos datos y mantener la integridad de la plataforma.

#### Criterios de Aceptación
- El administrador debe visualizar una lista de solicitudes de cambio de perfil pendientes.
- El administrador debe poder aceptar o rechazar dichas modificaciones.

**Prioridad:** Media

**Story Points:** 3

---
### HU-010 Descarga de Reportes Administrativos
**Como:** administrador

**Quiero:** descargar reportes estadísticos y logs en formato PDF

**Para:** analizar el rendimiento, los ingresos y la actividad general de la plataforma.

#### Criterios de Aceptación
- El sistema debe generar un documento PDF descargable con la información solicitada.
- El administrador debe poder seleccionar entre distintos reportes, como logs de registros, ingresos generados e historial de envíos.

**Prioridad:** Media

**Story Points:** 8

---


## Módulo de Operador Logístico

### HU-011 Registro de Servicio de Envío
**Como:** operador logístico aprobado

**Quiero:** registrar un nuevo servicio de envío

**Para:** que los clientes puedan buscarlo y contratarlo.

#### Criterios de Aceptación
- El operador debe poder ingresar zona de cobertura, capacidad de carga, precio por envío y mínimo 3 fotografías del vehículo o bodega.
- El servicio debe quedar disponible inmediatamente tras su creación.

**Prioridad:** Alta

**Story Points:** 5

---

### HU-012 Suspensión Temporal de Servicio
**Como:** operador logístico

**Quiero:** suspender uno de mis servicios temporalmente

**Para:** evitar reservaciones durante periodos de mantenimiento o inactividad.

#### Criterios de Aceptación
- El sistema debe proveer una opción para suspender temporalmente el servicio.
- Al suspenderse, el servicio debe ocultarse de los clientes sin eliminarse del sistema.

**Prioridad:** Baja

**Story Points:** 3

---

### HU-013 Visualización de Calendario de Envíos
**Como:** operador logístico

**Quiero:** consultar mis reservaciones en formato de calendario

**Para:** organizar mis tiempos y entregas de manera visual.

#### Criterios de Aceptación
- El operador debe poder visualizar una vista tipo calendario.
- El calendario debe mostrar las fechas en que los clientes han programado envíos.
- Debe existir una vista individual por servicio y una vista general.

**Prioridad:** Media

**Story Points:** 8

---

## Módulo de Empresa de Transporte

### HU-014 Carga Masiva de Rutas
**Como:** empresa de transporte

**Quiero:** subir un archivo con mis rutas de servicio

**Para:** registrar toda mi flota de manera rápida sin hacerlo uno por uno.

#### Criterios de Aceptación
- Las empresas de transporte deben poder cargar su flota y rutas en formato CSV.
- El sistema debe validar la estructura del archivo e insertar los registros exitosamente.
- Las empresas deben poder registrar rutas manualmente mediante un formulario en caso de no usar CSV.

**Prioridad:** Alta

**Story Points:** 8

---

### HU-015 Suspensión de Rutas por Emergencia
**Como:** empresa de transporte

**Quiero:** cancelar rutas específicas por emergencias o clima

**Para:** proteger la flota e informar a los clientes afectados.

#### Criterios de Aceptación
- Las empresas de transporte deben poder cancelar o suspender rutas por emergencias o condiciones climáticas.
- El sistema debe notificar inmediatamente por correo electrónico a los clientes afectados.

**Prioridad:** Alta

**Story Points:** 5

---

### HU-016 Generación de Cupones de Descuento
**Como:** operador logístico o empresa de transporte

**Quiero:** generar cupones o códigos de descuento por temporada

**Para:** ofrecer promociones y fidelizar a mis clientes.

#### Criterios de Aceptación
- El sistema debe permitir la creación de códigos de descuento personalizados.
- El proveedor debe poder definir las condiciones y restricciones del cupón.

**Prioridad:** Baja

**Story Points:** 5


---

## Módulo de Cliente

### HU-017 Búsqueda y Filtrado de Servicios
**Como:** cliente

**Quiero:** buscar y aplicar filtros a los servicios logísticos

**Para:** encontrar la opción que mejor se adapte a mi presupuesto y destino.

#### Criterios de Aceptación
- El cliente debe poder buscar servicios de envío por zona de cobertura, operador logístico y nombre del servicio.
- El cliente debe poder filtrar los resultados por orden alfabético, calificación, precio y capacidad de carga.

**Prioridad:** Alta

**Story Points:** 8

---

### HU-018 Sugerencia de Servicios Complementarios
**Como:** cliente

**Quiero:** recibir sugerencias de transporte al contratar un envío (y viceversa)

**Para:** facilitar la coordinación completa de mi logística.

#### Criterios de Aceptación
- Al elegir primero un servicio de envío, el sistema debe sugerir los 3 operadores de transporte mejor calificados para la misma zona.
- El cliente debe tener la opción de ver a todos los operadores si lo desea.

**Prioridad:** Media

**Story Points:** 5

---

### HU-019 Programación de Reservación
**Como:** cliente

**Quiero:** seleccionar las fechas de mi envío o transporte

**Para:** agendar el servicio según mi conveniencia.

#### Criterios de Aceptación
- El cliente debe poder seleccionar un rango de fechas para la programación.
- El sistema debe impedir que exista traslape con reservaciones existentes.
- El envío debe programarse con al menos 24 horas de anticipación.

**Prioridad:** Alta

**Story Points:** 8

---

### HU-020 Pago con Tarjeta (Algoritmo de Luhn)
**Como:** cliente

**Quiero:** realizar el pago de los servicios utilizando una tarjeta simulada

**Para:** confirmar mi reservación en el sistema.

#### Criterios de Aceptación
- El sistema debe permitir el uso de una tarjeta de crédito o débito simulada.
- El número de la tarjeta debe validarse mediante el algoritmo de Luhn implementado manualmente.
- El sistema debe asignar un saldo inicial de Q1,000 a la tarjeta ficticia registrada.

**Prioridad:** Alta

**Story Points:** 8

---

### HU-021 Carrito de Compras Persistente
**Como:** cliente

**Quiero:** que los servicios seleccionados se guarden en un carrito

**Para:** no perder mis reservaciones pendientes si cierro el navegador.

#### Criterios de Aceptación
- Los servicios seleccionados deben agregarse a un carrito de compras persistente.
- Los datos del carrito deben mantenerse incluso si el cliente cierra sesión en el sistema.

**Prioridad:** Media

**Story Points:** 5

---

### HU-022 Calificación y Reseñas de Servicios
**Como:** cliente

**Quiero:** poder otorgar una calificación y un comentario al servicio recibido

**Para:** compartir mi experiencia y retroalimentar a la comunidad.

#### Criterios de Aceptación
- El cliente debe poder calificar los servicios de envío una vez concluida la fecha de entrega.
- El cliente debe poder dejar un comentario y una puntuación al servicio.

**Prioridad:** Media

**Story Points:** 5

---

### HU-023 Reporte de Problemas con el Servicio
**Como:** cliente

**Quiero:** reportar incidencias con un proveedor logístico

**Para:** que la administración investigue retrasos, daños o cobros extras.

#### Criterios de Aceptación
- El cliente debe tener un apartado para reportar problemas relacionados con los servicios.
- El cliente debe poder adjuntar evidencias al reporte generado.
- El cliente debe poder ver el historial de reportes con sus estados correspondientes.

**Prioridad:** Media

**Story Points:** 5

---

### HU-024 Canje de Cupones
**Como:** cliente

**Quiero:** ingresar un código de descuento al momento de contratar un servicio

**Para:** obtener una rebaja en el costo total de mi reservación.

#### Criterios de Aceptación
- El sistema debe validar que el código ingresado exista y esté vigente.
- El cliente debe poder visualizar un historial de los cupones que ha utilizado y sus restricciones.
- El descuento debe reflejarse en el monto final antes de procesar el pago.

**Prioridad:** Media

**Story Points:** 3

---
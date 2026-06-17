# Dailys Retrospective

## Maria Fernanda Morales Lima
**Carnet:** 202300378
**Responsabilidad:** Login y autenticación por roles

| Aspecto | Resumen |
| --- | --- |
| Qué hice bien | Entendí la base del proyecto, me adapté al código existente e implementé el login para los cuatro roles con verificación en dos pasos para el admin. |
| Qué hice mal | Perdí tiempo por la configuración del entorno, Docker, el archivo `.env`, las rutas y algunos errores con hashes de contraseña. |
| Qué mejorar | Revisar mejor el entorno antes de empezar y comunicar antes cualquier bloqueo con el equipo. |

## Bryan Alejandro Anona Paredes
**Carnet:** 202307272
**Responsabilidad:** Módulo de correos

| Aspecto | Resumen |
| --- | --- |
| Qué hice bien | Implementé el envío de correos con Nodemailer y lo conecté de forma rápida con el frontend y las APIs del backend. |
| Qué hice mal | La base de datos quedó con credenciales de admin incorrectas, lo que interrumpió varias pruebas. |
| Qué mejorar | Compartir mejor el funcionamiento de mis APIs para que el equipo pueda trabajar sin depender de mi disponibilidad. |

## Josue David Figueroa Acosta
**Carnet:** 202307378
**Responsabilidad:** Módulo de administración

| Aspecto | Resumen |
| --- | --- |
| Qué hice bien | Distribuimos bien el trabajo y el proyecto avanzó rápido porque entendimos lo necesario en poco tiempo. |
| Qué hice mal | Hubo problemas de compatibilidad entre Windows y Linux con el script `.sh` de la base de datos. |
| Qué mejorar | Mantener mejor comunicación y seguir puliendo la forma de desarrollar el proyecto. |

## Susana Paola González Contreras
**Carnet:** 202000576
**Responsabilidad:** Documentación y prototipos de interfaces

| Aspecto | Resumen |
| --- | --- |
| Qué hice bien | Entregué a tiempo la documentación y los prototipos solicitados para el sprint. |
| Qué hice mal | Me tomó tiempo aprender a hacer los prototipos y elegir la herramienta adecuada. |
| Qué mejorar | Definir herramientas antes de iniciar y estimar mejor los tiempos en el tablero Kanban. |

## Melvin Geovanni García Sumalá
**Carnet:** 202300712
**Responsabilidad:** Base de datos y registro de usuarios

| Aspecto | Resumen |
| --- | --- |
| Qué hice bien | Organicé el tablero Kanban con las columnas y tarjetas necesarias para dar seguimiento al sprint. |
| Qué hice mal | Algunas tarjetas no fueron lo bastante específicas y eso generó confusión sobre el alcance. |
| Qué mejorar | Resolver dudas sobre el enunciado al inicio del sprint para evitar reinterpretaciones durante la implementación. |

---

# Daily Scrum — Sprint 1 — Día 1

Fecha: 13 Junio 2026

### Integrante 1: Maria Fernanda Morales Lima - 202300378
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Revisé el código base que ya tenían avanzado mis compañeros para entender la estructura y adaptar mi parte sin romper nada. |
| **¿Qué haré hoy?** | Intentaré levantar el proyecto (frontend, backend y base de datos) para empezar a trabajar en el login. |
| **¿Impedimentos?** | Es la primera vez que trabajo con Docker en equipo y estoy teniendo muchos problemas de configuración con el archivo `.env`. |

### Integrante 2: Josue David Figueroa Acosta - 202307378
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Revisé los requerimientos del módulo de administrador para entender el flujo de aprobación de operadores y empresas. |
| **¿Qué haré hoy?** | Empezaré a codificar las vistas para ver, aceptar y rechazar solicitudes en el dashboard. |
| **¿Impedimentos?** | Estamos teniendo problemas de compatibilidad con versiones de Windows y Linux al momento de ejecutar el script `.sh` de la base de datos. |

### Integrante 3: Bryan Alejandro Anona Paredes - 202307272
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Investigué y preparé el entorno de Node.js instalando la librería Nodemailer para el servicio de correos. |
| **¿Qué haré hoy?** | Empezaré a crear las APIs desde el backend y a preparar las plantillas HTML para la verificación de correos. |
| **¿Impedimentos?** | Ninguno por el momento. |

### Integrante 4: Susana Paola González Contreras - 202000576
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Logré organizar la estructura del documento y avanzar con los Requerimientos Funcionales y No Funcionales. |
| **¿Qué haré hoy?** | Comenzaré a redactar las Historias de Usuario y armar los Diagramas de Casos de Uso. |
| **¿Impedimentos?** | Ninguno por el momento. |

### Integrante 5: Melvin Geovanni García Sumalá - 202300712
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Organicé el tablero Kanban creando las columnas y las tarjetas necesarias para que todos podamos dar seguimiento al sprint. |
| **¿Qué haré hoy?** | Trabajaré en la creación de toda la estructura de la base de datos. |
| **¿Impedimentos?** | Ninguno por el momento. |

---

# Daily Scrum — Sprint 1 — Día 2

Fecha: 15 Junio 2026

### Integrante 1: Maria Fernanda Morales Lima - 202300378
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Logré resolver los problemas del Docker y empecé a programar el login, pero perdí tiempo con las rutas hacia los dashboards y con unos hashes de contraseñas que se guardaban mal por caracteres especiales. |
| **¿Qué haré hoy?** | Dejaré funcionando el login básico para clientes, operadores y empresas. |
| **¿Impedimentos?** | Me sigue costando un poco el entorno de desarrollo, necesito comunicarme más rápido con el equipo cuando me trabo. |

### Integrante 2: Josue David Figueroa Acosta - 202307378
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Terminé la función de revisar y aceptar/rechazar solicitudes y empecé con el agendamiento de reuniones virtuales. |
| **¿Qué haré hoy?** | Terminaré el login de empresas que depende de la reunión y el registro de nuevos administradores. |
| **¿Impedimentos?** | Tuvimos interrupciones en las pruebas porque las credenciales del admin en la base de datos estaban incorrectas. |

### Integrante 3: Bryan Alejandro Anona Paredes - 202307272
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Logré optimizar el tiempo de envío de correos y conecté fácilmente el frontend con las APIs del backend. |
| **¿Qué haré hoy?** | Implementaré el envío del token de 6 dígitos para el 2FA del administrador. |
| **¿Impedimentos?** | Ayer no levanté bien la DB y creé un usuario y contraseña de admin incorrectos, lo que interrumpió las pruebas del equipo. Lo arreglaré hoy. |

### Integrante 4: Susana Paola González Contreras - 202000576
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Logré terminar todas las Historias de Usuario y los Casos de Uso en formato Markdown. |
| **¿Qué haré hoy?** | Empezaré con el Prototipo de interfaces. |
| **¿Impedimentos?** | Me está costando bastante esta parte porque no tengo conocimiento previo sobre cómo hacer prototipos ni qué herramienta utilizar. Estoy perdiendo tiempo investigando esto desde cero. |

### Integrante 5: Melvin Geovanni García Sumalá - 202300712
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Terminé de levantar la base de datos completa y comencé con el endpoint de registro de clientes. |
| **¿Qué haré hoy?** | Terminaré el registro para operadores y para empresas, validando que pidan campos distintos. |
| **¿Impedimentos?** | Me di cuenta de que algunas tarjetas que creé en el Kanban no fueron lo bastante específicas y generaron algo de confusión en el equipo sobre los alcances. |

---

# Daily Scrum — Sprint 1 — Día 3

Fecha: 16 Junio 2026

### Integrante 1: Maria Fernanda Morales Lima - 202300378
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Terminé por completo el login y la redirección por roles, sin romper el código que ya existía. |
| **¿Qué haré hoy?** | Implementaré la verificación en dos pasos (2FA) para el administrador y coordinaré las credenciales finales con todos para las pruebas. |
| **¿Impedimentos?** | Ninguno, ya superé los problemas iniciales de configuración. |

### Integrante 2: Josue David Figueroa Acosta - 202307378
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Terminé todas las tareas del módulo de administrador logrando finalizar en un tiempo menor al acordado. |
| **¿Qué haré hoy?** | Apoyaré en las pruebas finales del sistema y la revisión del flujo completo. |
| **¿Impedimentos?** | Ninguno, la buena distribución del trabajo nos ayudó bastante. |

### Integrante 3: Bryan Alejandro Anona Paredes - 202307272
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Corregí el problema de la base de datos y dejé funcionando el envío del token 2FA del admin. |
| **¿Qué haré hoy?** | Documentaré mis APIs y me comunicaré con el equipo para que no tengan dudas de cómo funcionan si no estoy disponible. |
| **¿Impedimentos?** | Ninguno, correos finalizados. |

### Integrante 4: Susana Paola González Contreras - 202000576
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Logré terminar los Prototipos de Interfaces. |
| **¿Qué haré hoy?** | Consolidaré la Documentación Inicial completa para entregarla a tiempo. |
| **¿Impedimentos?** | Ninguno, logré terminar a pesar del contratiempo investigando sobre prototipado. |

### Integrante 5: Melvin Geovanni García Sumalá - 202300712
| Pregunta | Respuesta |
| --- | --- |
| **¿Qué hice ayer?** | Finalicé la lógica de registro para todos los tipos de usuarios con sus respectivos campos obligatorios. |
| **¿Qué haré hoy?** | Revisaré que el tablero Kanban esté actualizado y apoyaré en resolver cualquier duda final sobre el enunciado. |
| **¿Impedimentos?** | Ninguno por el momento. |




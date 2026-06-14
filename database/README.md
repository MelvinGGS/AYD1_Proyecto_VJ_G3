# Configuración de Base de Datos 

Configuración y el esquema de la base de datos PostgreSQL para el proyecto **TrackFlow-HUB**.

## Instrucciones de Inicio Rápido

### 2. Levantar el Contenedor
Ejecuta el siguiente comando para iniciar el contenedor de la base de datos en segundo plano:
```bash
docker compose up -d
```

> Ejecutará primero `01-schema.sql` (creando las tablas) y posteriormente `02-init-admin.sh` (inyectando el usuario administrador utilizando variables del `.env` local).

### 3. Verificar estado
Puedes ver si el contenedor está corriendo con:
```bash
docker compose ps
```
Y ver los logs de inicialización con:
```bash
docker compose logs -f
```

### 4. Apagar el Contenedor
Para detener los contenedores:
```bash
docker compose down
```
Borrar la base de datos para iniciar la base de datos desde cero:
```bash
docker compose down -v
```

---

## Conexión desde DBeaver

Para gestionar y consultar la base de datos localmente usando DBeaver, sigue estos pasos:

1. Abre **DBeaver**.
2. Selecciona **Nueva conexión** (icono de enchufe con un "+") y elige **PostgreSQL**.
3. Configura los parámetros de conexión basándote en tu archivo `.env`:
   - **Host:** `localhost`
   - **Port:** `5432` 
   - **Database:** El valor de `DB_NAME` 
   - **Username:** El valor de `DB_USER` 
   - **Password:** El valor de `DB_PASSWORD`
4. Haz clic en **Test Connection** para validar que todo funcione correctamente (DBeaver te pedirá descargar los drivers de PostgreSQL si no los tienes).
5. Haz clic en **Finalizar**. ¡Listo! Ya puedes ver todas las tablas y enums creados.

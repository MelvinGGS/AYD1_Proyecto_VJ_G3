## Como Levantar el Proyecto

Para iniciar todo la primera vez, ejecuta el siguiente comando en la raiz del proyecto (AYD1_Proyecto_VJ_G3/):

```bash
docker compose up --build
```

## Comando para levantar despues

```bash
docker compose up -d
```

## detener los Contenedores
Para apagar todos los servicios conservando los datos:
```bash
docker compose down
```

## Borrar la db para iniciar desde cero:
```bash
docker compose down -v
```

### Puertos disponibles:
* Frontend: http://localhost:5173
* Backend: http://localhost:3000
* Base de Datos: localhost:5432

## actualizaciones automaticas

* Cualquier cambio que hagan (en frontend o en backend) se refleja instantaneamente dentro del contenedor sin reiniciar.
* Si hacen un git pull, cambian de rama en Git o descargan archivos nuevos, los contenedores se actualizaran automaticamente.
* Solo si agregan una nueva dependencia en package.json (un nuevo paquete npm), van a tener que detener los contenedores y volver a levantarlos con "docker compose up --build" para instalar el paquete dentro de la imagen.
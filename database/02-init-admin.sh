#!/bin/bash
set -e

# Validar que las variables de entorno estén configuradas
if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD_HASH" ]; then
  echo "Las variablesno están configuradas. No se puede crear el admin"
  exit 0
fi

echo "Creando usuario admin ($ADMIN_EMAIL)..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Insertar en la tabla usuarios si no existe ya
    INSERT INTO usuarios (id, email, password_hash, rol, estado, email_verificado)
    VALUES (
        'd03b306e-8d26-4e58-941f-c0dc543597d3',
        '$ADMIN_EMAIL',
        '$ADMIN_PASSWORD_HASH',
        'administrador',
        'activo',
        TRUE
    ) ON CONFLICT (email) DO NOTHING;

    -- Insertar en la tabla administradores con id anterior
    INSERT INTO administradores (id, nombre, apellido)
    VALUES (
        'd03b306e-8d26-4e58-941f-c0dc543597d3',
        'Admin',
        'TrackFlow'
    ) ON CONFLICT (id) DO NOTHING;
EOSQL

echo "Usuario admin creado"

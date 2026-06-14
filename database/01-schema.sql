CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- TIPOS ENUMERADOS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('cliente', 'operador', 'empresa_transporte', 'administrador');
CREATE TYPE user_status AS ENUM ('pendiente_verificacion', 'verificado', 'pendiente_aprobacion', 'activo', 'vetado', 'suspendido');
CREATE TYPE gender_type AS ENUM ('masculino', 'femenino', 'otro', 'prefiero_no_decir');
CREATE TYPE registration_request_status AS ENUM ('pendiente', 'en_revision', 'aceptado', 'rechazado');

CREATE TYPE service_status AS ENUM ('activo', 'suspendido', 'eliminado');
CREATE TYPE route_status AS ENUM ('activa', 'suspendida', 'cancelada');
CREATE TYPE report_status AS ENUM ('enviado', 'en_revision', 'aceptado', 'rechazado');
CREATE TYPE profile_change_status AS ENUM ('pendiente', 'aceptado', 'rechazado');

CREATE TYPE booking_status AS ENUM ('en_carrito', 'pendiente_pago', 'confirmado', 'en_transito', 'entregado', 'cancelado', 'reembolsado');
CREATE TYPE payment_method_type AS ENUM ('tarjeta', 'wallet');
CREATE TYPE payment_status AS ENUM ('pendiente', 'completado', 'fallido', 'reembolsado');
CREATE TYPE coupon_status AS ENUM ('activo', 'expirado', 'agotado');
CREATE TYPE coupon_discount_type AS ENUM ('porcentaje', 'monto_fijo');
CREATE TYPE notification_type AS ENUM ('registro', 'aprobacion', 'rechazo', 'veto', 'reporte', 'cupon', 'cancelacion_ruta', 'cambio_perfil', 'general');



-- Usuarios
CREATE TABLE usuarios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    rol             user_role NOT NULL,
    estado          user_status NOT NULL DEFAULT 'pendiente_verificacion',
    
    -- Verificación de email
    email_verificado        BOOLEAN NOT NULL DEFAULT FALSE,
    token_verificacion      VARCHAR(6),         -- Token de 6 caracteres
    token_verificacion_exp  TIMESTAMPTZ,        -- Expiración del token
    
    -- 2FA para administradores
    token_2fa               VARCHAR(6),
    token_2fa_exp           TIMESTAMPTZ,        -- Vigencia de 2 minutos
    
    -- Control de contraseña temporal (operadores)
    requiere_cambio_password BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Veto
    motivo_veto     TEXT,
    fecha_veto      TIMESTAMPTZ,
    vetado_por      UUID,                       -- FK a usuarios(id) del admin que vetó
    
    -- Suspensión temporal
    suspendido_hasta TIMESTAMPTZ,
    motivo_suspension TEXT,
    
    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);

-- Clientes 
CREATE TABLE clientes (
    id                      UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre                  VARCHAR(100) NOT NULL,
    apellido                VARCHAR(100) NOT NULL,
    telefono                VARCHAR(20) NOT NULL,
    direccion_origen        TEXT,                -- Dirección de origen predeterminada
    foto_perfil             TEXT,                -- URL de la foto
    
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Operadores_logisticos 
CREATE TABLE operadores_logisticos (
    id                      UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre                  VARCHAR(100) NOT NULL,
    apellido                VARCHAR(100) NOT NULL,
    dpi_cui                 VARCHAR(20) UNIQUE NOT NULL,
    telefono                VARCHAR(20) NOT NULL,
    telefono_respaldo       VARCHAR(20),
    fotografia              TEXT NOT NULL,       -- URL de la fotografía obligatoria
    zona_operacion          VARCHAR(255) NOT NULL,
    genero                  gender_type NOT NULL,
    
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Empresas_transporte 
CREATE TABLE empresas_transporte (
    id                          UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_empresa              VARCHAR(255) NOT NULL,
    telefono                    VARCHAR(20) NOT NULL,
    telefono_respaldo           VARCHAR(20),
    nit                         VARCHAR(20) UNIQUE NOT NULL,
    numero_licencia_operativa   VARCHAR(50) UNIQUE NOT NULL,
    logo                        TEXT,               -- URL del logo de la empresa
    
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Administradores 
CREATE TABLE administradores (
    id              UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    telefono        VARCHAR(20),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- solicitudes_registro
-- Rastrea el estado de aprobación de operadores y empresas de transporte.
-- El admin acepta/rechaza operadores y agenda reuniones con empresas.

CREATE TABLE solicitudes_registro (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id          UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estado              registration_request_status NOT NULL DEFAULT 'pendiente',
    
    -- Para empresas de transporte: reunión virtual
    reunion_fecha       TIMESTAMPTZ,
    reunion_enlace      TEXT,
    reunion_agendada    BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Resolución
    revisado_por        UUID REFERENCES usuarios(id),   -- Admin que revisó
    motivo_rechazo      TEXT,
    fecha_resolucion    TIMESTAMPTZ,
    
    -- Comentarios adicionales
    notas               TEXT,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_solicitudes_usuario ON solicitudes_registro(usuario_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes_registro(estado);

-- sesiones (JWT / sesiones activas)
CREATE TABLE sesiones (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    refresh_token   VARCHAR(500) NOT NULL,
    ip_address      INET,
    user_agent      TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sesiones_usuario ON sesiones(usuario_id);
CREATE INDEX idx_sesiones_token ON sesiones(refresh_token);

-- log_actividad 
-- Registra acciones importantes.
-- para los reportes del administrador 
CREATE TABLE log_actividad (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id      UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    accion          VARCHAR(100) NOT NULL,       -- registro, login, veto, aprobacion
    descripcion     TEXT,
    entidad_tipo    VARCHAR(50),                 -- 'usuario', 'servicio', 'envio'
    entidad_id      UUID,                        -- ID de la entidad afectada
    ip_address      INET,
    metadata        JSONB,                       -- Datos adicionales flexibles
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_log_usuario ON log_actividad(usuario_id);
CREATE INDEX idx_log_accion ON log_actividad(accion);
CREATE INDEX idx_log_created ON log_actividad(created_at);


-- servicios_envio (Operadores Logísticos)
CREATE TABLE servicios_envio (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operador_id         UUID NOT NULL REFERENCES operadores_logisticos(id) ON DELETE CASCADE,
    nombre_servicio     VARCHAR(255) NOT NULL,
    descripcion         TEXT,
    zona_cobertura      VARCHAR(255) NOT NULL,
    capacidad_carga_kg  DECIMAL(10,2) NOT NULL,     -- Capacidad en kg
    precio_envio        DECIMAL(10,2) NOT NULL,     -- Precio por envío en Quetzales
    estado              service_status NOT NULL DEFAULT 'activo',
    
    -- Campos adicionales definidos por el equipo
    tiempo_estimado_entrega VARCHAR(100),            -- ej: "2-3 días"
    tipo_vehiculo       VARCHAR(100),
    horario_disponible  VARCHAR(255),                -- ej: "Lunes a Viernes 8:00-17:00"
    
    -- Estadísticas calculadas 
    calificacion_promedio DECIMAL(3,2) DEFAULT 0,
    total_calificaciones  INTEGER DEFAULT 0,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_servicios_operador ON servicios_envio(operador_id);
CREATE INDEX idx_servicios_zona ON servicios_envio(zona_cobertura);
CREATE INDEX idx_servicios_estado ON servicios_envio(estado);
CREATE INDEX idx_servicios_precio ON servicios_envio(precio_envio);
CREATE INDEX idx_servicios_calificacion ON servicios_envio(calificacion_promedio DESC);

-- fotos_servicio (mínimo 3 fotos por servicio)
CREATE TABLE fotos_servicio (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servicio_id     UUID NOT NULL REFERENCES servicios_envio(id) ON DELETE CASCADE,
    url_foto        TEXT NOT NULL,
    descripcion     VARCHAR(255),
    orden           INTEGER NOT NULL DEFAULT 0,     -- Para ordenar las fotos
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fotos_servicio ON fotos_servicio(servicio_id);

-- rutas_transporte (Empresas de Transporte)
CREATE TABLE rutas_transporte (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id              UUID NOT NULL REFERENCES empresas_transporte(id) ON DELETE CASCADE,
    nombre_ruta             VARCHAR(255) NOT NULL,
    origen                  VARCHAR(255) NOT NULL,
    destino                 VARCHAR(255) NOT NULL,
    tipo_servicio           VARCHAR(100) NOT NULL,   -- ej: "express", "estándar", "económico"
    precio                  DECIMAL(10,2) NOT NULL,
    tiempo_estimado         VARCHAR(100),             -- ej: "4 horas"
    hora_salida             TIME,
    hora_llegada_estimada   TIME,
    dias_disponibles        VARCHAR(100),             -- ej: "L,M,Mi,J,V"
    capacidad_pasajeros     INTEGER,
    estado                  route_status NOT NULL DEFAULT 'activa',
    motivo_cancelacion      TEXT,                     -- Para cancelaciones por emergencia
    
    -- Estadísticas
    calificacion_promedio   DECIMAL(3,2) DEFAULT 0,
    total_calificaciones    INTEGER DEFAULT 0,
    
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rutas_empresa ON rutas_transporte(empresa_id);
CREATE INDEX idx_rutas_destino ON rutas_transporte(destino);
CREATE INDEX idx_rutas_estado ON rutas_transporte(estado);
CREATE INDEX idx_rutas_precio ON rutas_transporte(precio);

-- flota_vehiculos 
CREATE TABLE flota_vehiculos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id      UUID NOT NULL REFERENCES empresas_transporte(id) ON DELETE CASCADE,
    tipo_vehiculo   VARCHAR(100) NOT NULL,       -- ej: "bus", "microbús", "camión"
    placa           VARCHAR(20) UNIQUE NOT NULL,
    capacidad       INTEGER NOT NULL,
    modelo          VARCHAR(100),
    anio            INTEGER,
    estado          VARCHAR(50) NOT NULL DEFAULT 'disponible',  -- disponible, en_ruta, mantenimiento
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flota_empresa ON flota_vehiculos(empresa_id);

-- TABLA: reportes
-- Reportes de clientes a operadores/empresas y de operadores a clientes.
CREATE TABLE reportes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reportado_por       UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    reportado_usuario   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Contexto del reporte
    tipo_servicio       VARCHAR(50) NOT NULL,         -- 'envio' o 'transporte'
    servicio_id         UUID,                          -- FK al servicio/ruta relacionado
    reservacion_id      UUID,                          -- FK a la reservación relacionada
    
    motivo              VARCHAR(255) NOT NULL,
    descripcion         TEXT NOT NULL,
    estado              report_status NOT NULL DEFAULT 'enviado',
    
    -- Resolución
    revisado_por        UUID REFERENCES usuarios(id),  -- Admin que revisó
    resolucion          TEXT,
    sancion_aplicada    TEXT,
    fecha_resolucion    TIMESTAMPTZ,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reportes_reportado_por ON reportes(reportado_por);
CREATE INDEX idx_reportes_reportado_usuario ON reportes(reportado_usuario);
CREATE INDEX idx_reportes_estado ON reportes(estado);

-- evidencias_reporte 
CREATE TABLE evidencias_reporte (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_id      UUID NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
    url_archivo     TEXT NOT NULL,
    tipo_archivo    VARCHAR(20) NOT NULL,     -- 'imagen', 'video'
    descripcion     VARCHAR(255),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidencias_reporte ON evidencias_reporte(reporte_id);

-- solicitudes_cambio_perfil
-- Operadores y empresas solicitan cambios; admin aprueba/rechaza.
CREATE TABLE solicitudes_cambio_perfil (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    campos_nuevos   JSONB NOT NULL,              -- { "telefono": "1234-5678", "zona_operacion": "zona 10" }
    campos_previos  JSONB NOT NULL,              -- Valores anteriores para auditoría
    estado          profile_change_status NOT NULL DEFAULT 'pendiente',
    revisado_por    UUID REFERENCES usuarios(id),
    motivo_rechazo  TEXT,
    fecha_resolucion TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cambio_perfil_usuario ON solicitudes_cambio_perfil(usuario_id);
CREATE INDEX idx_cambio_perfil_estado ON solicitudes_cambio_perfil(estado);

-- metodos_pago
-- Tarjetas simuladas, Luhn + wallet. Saldo inicial Q1,000 por tarjeta.
CREATE TABLE metodos_pago (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    tipo            payment_method_type NOT NULL,
    
    -- Tarjeta de crédito/débito (simulada)
    numero_tarjeta  VARCHAR(20),             -- Validado con algoritmo de Luhn
    nombre_tarjeta  VARCHAR(255),
    fecha_vencimiento VARCHAR(7),            -- MM/YYYY
    cvv_hash        VARCHAR(255),            -- Se almacena hasheado
    
    -- Wallet (método alternativo)
    wallet_id       VARCHAR(100),
    
    -- Saldo simulado
    saldo           DECIMAL(12,2) NOT NULL DEFAULT 1000.00,  -- Q1,000 iniciales
    
    es_predeterminado BOOLEAN NOT NULL DEFAULT FALSE,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_metodos_pago_cliente ON metodos_pago(cliente_id);

-- carrito_compras 
CREATE TABLE carrito_compras (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    
    -- Item puede ser un servicio de envío o una ruta de transporte
    tipo_servicio   VARCHAR(50) NOT NULL,        -- 'envio' o 'transporte'
    servicio_envio_id   UUID REFERENCES servicios_envio(id) ON DELETE CASCADE,
    ruta_transporte_id  UUID REFERENCES rutas_transporte(id) ON DELETE CASCADE,
    
    -- Detalles de la reserva
    fecha_inicio    DATE NOT NULL,
    fecha_fin       DATE,                        -- Para envíos con rango de fechas
    cantidad        INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal        DECIMAL(10,2) NOT NULL,
    
    -- Cupón aplicado (si existe)
    cupon_id        UUID,                        -- FK a cupones, se agrega después
    descuento       DECIMAL(10,2) DEFAULT 0,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Validación: debe tener exactamente uno de los dos tipos de servicio
    CONSTRAINT chk_tipo_servicio CHECK (
        (tipo_servicio = 'envio' AND servicio_envio_id IS NOT NULL AND ruta_transporte_id IS NULL) OR
        (tipo_servicio = 'transporte' AND ruta_transporte_id IS NOT NULL AND servicio_envio_id IS NULL)
    )
);

CREATE INDEX idx_carrito_cliente ON carrito_compras(cliente_id);

-- reservaciones
CREATE TABLE reservaciones (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id          UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    
    tipo_servicio       VARCHAR(50) NOT NULL,         -- 'envio' o 'transporte'
    servicio_envio_id   UUID REFERENCES servicios_envio(id),
    ruta_transporte_id  UUID REFERENCES rutas_transporte(id),
    
    estado              booking_status NOT NULL DEFAULT 'pendiente_pago',
    
    -- Fechas
    fecha_inicio        DATE NOT NULL,
    fecha_fin           DATE,
    
    -- Dirección de envío (si aplica)
    direccion_origen    TEXT,
    direccion_destino   TEXT,
    descripcion_paquete TEXT,
    peso_paquete_kg     DECIMAL(10,2),
    
    -- Precio y comisiones
    precio_total        DECIMAL(10,2) NOT NULL,
    comision_plataforma DECIMAL(10,2) NOT NULL,       -- 20% envíos, 10% transporte
    ganancia_proveedor  DECIMAL(10,2) NOT NULL,       -- 80% envíos, 90% transporte
    descuento_aplicado  DECIMAL(10,2) DEFAULT 0,
    
    -- Cancelación
    fecha_cancelacion   TIMESTAMPTZ,
    motivo_cancelacion  TEXT,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_reservacion_servicio CHECK (
        (tipo_servicio = 'envio' AND servicio_envio_id IS NOT NULL AND ruta_transporte_id IS NULL) OR
        (tipo_servicio = 'transporte' AND ruta_transporte_id IS NOT NULL AND servicio_envio_id IS NULL)
    )
);

CREATE INDEX idx_reservaciones_cliente ON reservaciones(cliente_id);
CREATE INDEX idx_reservaciones_servicio ON reservaciones(servicio_envio_id);
CREATE INDEX idx_reservaciones_ruta ON reservaciones(ruta_transporte_id);
CREATE INDEX idx_reservaciones_estado ON reservaciones(estado);
CREATE INDEX idx_reservaciones_fechas ON reservaciones(fecha_inicio, fecha_fin);

-- pagos
CREATE TABLE pagos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservacion_id      UUID NOT NULL REFERENCES reservaciones(id) ON DELETE CASCADE,
    cliente_id          UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    metodo_pago_id      UUID NOT NULL REFERENCES metodos_pago(id),
    
    monto               DECIMAL(10,2) NOT NULL,
    estado              payment_status NOT NULL DEFAULT 'pendiente',
    referencia          VARCHAR(100) UNIQUE,         -- Número de referencia del pago
    
    -- Reembolso
    monto_reembolso     DECIMAL(10,2),
    fecha_reembolso     TIMESTAMPTZ,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pagos_reservacion ON pagos(reservacion_id);
CREATE INDEX idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX idx_pagos_estado ON pagos(estado);

-- calificaciones
CREATE TABLE calificaciones (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id          UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    reservacion_id      UUID NOT NULL REFERENCES reservaciones(id) ON DELETE CASCADE,
    
    tipo_servicio       VARCHAR(50) NOT NULL,         -- 'envio' o 'transporte'
    servicio_envio_id   UUID REFERENCES servicios_envio(id),
    ruta_transporte_id  UUID REFERENCES rutas_transporte(id),
    
    puntuacion          INTEGER NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
    comentario          TEXT,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Un cliente solo puede calificar una vez por reservación
    CONSTRAINT uq_calificacion_reservacion UNIQUE (cliente_id, reservacion_id)
);

CREATE INDEX idx_calificaciones_servicio ON calificaciones(servicio_envio_id);
CREATE INDEX idx_calificaciones_ruta ON calificaciones(ruta_transporte_id);
CREATE INDEX idx_calificaciones_cliente ON calificaciones(cliente_id);

-- respuestas_calificacion 
CREATE TABLE respuestas_calificacion (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calificacion_id     UUID NOT NULL REFERENCES calificaciones(id) ON DELETE CASCADE,
    operador_id         UUID NOT NULL REFERENCES operadores_logisticos(id) ON DELETE CASCADE,
    respuesta           TEXT NOT NULL,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Un operador solo puede responder una vez por calificación
    CONSTRAINT uq_respuesta_calificacion UNIQUE (calificacion_id, operador_id)
);

-- TABLA: cupones
CREATE TABLE cupones (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creado_por          UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,  -- Operador o empresa
    
    codigo              VARCHAR(50) UNIQUE NOT NULL,
    descripcion         TEXT,
    tipo_descuento      coupon_discount_type NOT NULL,
    valor_descuento     DECIMAL(10,2) NOT NULL,       -- % o monto fijo
    
    -- Restricciones
    monto_minimo        DECIMAL(10,2),                -- Monto mínimo de compra
    usos_maximos        INTEGER,                       -- Límite total de usos
    usos_actuales       INTEGER NOT NULL DEFAULT 0,
    uso_por_cliente     INTEGER DEFAULT 1,             -- Máx usos por cliente
    
    -- Vigencia
    fecha_inicio        DATE NOT NULL,
    fecha_fin           DATE NOT NULL,
    estado              coupon_status NOT NULL DEFAULT 'activo',
    
    -- Aplica a
    tipo_servicio       VARCHAR(50),                   -- 'envio', 'transporte', o NULL = ambos
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cupones_codigo ON cupones(codigo);
CREATE INDEX idx_cupones_creador ON cupones(creado_por);
CREATE INDEX idx_cupones_estado ON cupones(estado);

-- cupones_clientes 
-- cupones enviados a clientes específicos
CREATE TABLE cupones_clientes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cupon_id        UUID NOT NULL REFERENCES cupones(id) ON DELETE CASCADE,
    cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    canjeado        BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_canje     TIMESTAMPTZ,
    reservacion_id  UUID REFERENCES reservaciones(id),  -- En qué reservación se usó
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_cupon_cliente UNIQUE (cupon_id, cliente_id)
);

CREATE INDEX idx_cupones_clientes_cliente ON cupones_clientes(cliente_id);
CREATE INDEX idx_cupones_clientes_cupon ON cupones_clientes(cupon_id);

-- FK del carrito
ALTER TABLE carrito_compras 
    ADD CONSTRAINT fk_carrito_cupon FOREIGN KEY (cupon_id) REFERENCES cupones(id);

-- notificaciones
CREATE TABLE notificaciones (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo            notification_type NOT NULL,
    titulo          VARCHAR(255) NOT NULL,
    mensaje         TEXT NOT NULL,
    leida           BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Enlace a la entidad relacionada (opcional)
    entidad_tipo    VARCHAR(50),
    entidad_id      UUID,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(usuario_id, leida);
CREATE INDEX idx_notificaciones_created ON notificaciones(created_at DESC);


-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
          AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_updated_at();
        ', t);
    END LOOP;
END;
$$;

-- Función para actualizar calificación promedio de servicios de envío
CREATE OR REPLACE FUNCTION actualizar_calificacion_servicio()
RETURNS TRIGGER AS $$
DECLARE
    v_servicio_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_servicio_id := OLD.servicio_envio_id;
    ELSE
        v_servicio_id := NEW.servicio_envio_id;
    END IF;

    IF v_servicio_id IS NOT NULL THEN
        UPDATE servicios_envio
        SET 
            calificacion_promedio = (
                SELECT COALESCE(AVG(puntuacion), 0)
                FROM calificaciones
                WHERE servicio_envio_id = v_servicio_id
            ),
            total_calificaciones = (
                SELECT COUNT(*)
                FROM calificaciones
                WHERE servicio_envio_id = v_servicio_id
            )
        WHERE id = v_servicio_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_calificacion_servicio
AFTER INSERT OR UPDATE OR DELETE ON calificaciones
FOR EACH ROW
EXECUTE FUNCTION actualizar_calificacion_servicio();

-- Función para actualizar calificación promedio de rutas de transporte
CREATE OR REPLACE FUNCTION actualizar_calificacion_ruta()
RETURNS TRIGGER AS $$
DECLARE
    v_ruta_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_ruta_id := OLD.ruta_transporte_id;
    ELSE
        v_ruta_id := NEW.ruta_transporte_id;
    END IF;

    IF v_ruta_id IS NOT NULL THEN
        UPDATE rutas_transporte
        SET 
            calificacion_promedio = (
                SELECT COALESCE(AVG(puntuacion), 0)
                FROM calificaciones
                WHERE ruta_transporte_id = v_ruta_id
            ),
            total_calificaciones = (
                SELECT COUNT(*)
                FROM calificaciones
                WHERE ruta_transporte_id = v_ruta_id
            )
        WHERE id = v_ruta_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_calificacion_ruta
AFTER INSERT OR UPDATE OR DELETE ON calificaciones
FOR EACH ROW
EXECUTE FUNCTION actualizar_calificacion_ruta();





--
-- PostgreSQL database dump
--

\restrict N0G5AzZjggyF6f6B7YKWjvxrQeZeDsn9SD8nn0Snm9hEnRBz1mhvHrvN0ZJ7VTY

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.booking_status AS ENUM (
    'en_carrito',
    'pendiente_pago',
    'confirmado',
    'en_transito',
    'entregado',
    'cancelado',
    'reembolsado'
);


ALTER TYPE public.booking_status OWNER TO admin;

--
-- Name: coupon_discount_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.coupon_discount_type AS ENUM (
    'porcentaje',
    'monto_fijo'
);


ALTER TYPE public.coupon_discount_type OWNER TO admin;

--
-- Name: coupon_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.coupon_status AS ENUM (
    'activo',
    'expirado',
    'agotado'
);


ALTER TYPE public.coupon_status OWNER TO admin;

--
-- Name: gender_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.gender_type AS ENUM (
    'masculino',
    'femenino',
    'otro',
    'prefiero_no_decir'
);


ALTER TYPE public.gender_type OWNER TO admin;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.notification_type AS ENUM (
    'registro',
    'aprobacion',
    'rechazo',
    'veto',
    'reporte',
    'cupon',
    'cancelacion_ruta',
    'cambio_perfil',
    'general'
);


ALTER TYPE public.notification_type OWNER TO admin;

--
-- Name: payment_method_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.payment_method_type AS ENUM (
    'tarjeta',
    'wallet'
);


ALTER TYPE public.payment_method_type OWNER TO admin;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.payment_status AS ENUM (
    'pendiente',
    'completado',
    'fallido',
    'reembolsado'
);


ALTER TYPE public.payment_status OWNER TO admin;

--
-- Name: profile_change_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.profile_change_status AS ENUM (
    'pendiente',
    'aceptado',
    'rechazado'
);


ALTER TYPE public.profile_change_status OWNER TO admin;

--
-- Name: registration_request_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.registration_request_status AS ENUM (
    'pendiente',
    'en_revision',
    'aceptado',
    'rechazado'
);


ALTER TYPE public.registration_request_status OWNER TO admin;

--
-- Name: report_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.report_status AS ENUM (
    'enviado',
    'en_revision',
    'aceptado',
    'rechazado'
);


ALTER TYPE public.report_status OWNER TO admin;

--
-- Name: route_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.route_status AS ENUM (
    'activa',
    'suspendida',
    'cancelada'
);


ALTER TYPE public.route_status OWNER TO admin;

--
-- Name: service_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.service_status AS ENUM (
    'activo',
    'suspendido',
    'eliminado'
);


ALTER TYPE public.service_status OWNER TO admin;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.user_role AS ENUM (
    'cliente',
    'operador',
    'empresa_transporte',
    'administrador'
);


ALTER TYPE public.user_role OWNER TO admin;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.user_status AS ENUM (
    'pendiente_verificacion',
    'verificado',
    'pendiente_aprobacion',
    'activo',
    'vetado',
    'suspendido'
);


ALTER TYPE public.user_status OWNER TO admin;

--
-- Name: actualizar_calificacion_ruta(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.actualizar_calificacion_ruta() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

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

$$;


ALTER FUNCTION public.actualizar_calificacion_ruta() OWNER TO admin;

--
-- Name: actualizar_calificacion_servicio(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.actualizar_calificacion_servicio() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

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

$$;


ALTER FUNCTION public.actualizar_calificacion_servicio() OWNER TO admin;

--
-- Name: trigger_set_updated_at(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.trigger_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.updated_at = NOW();

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.trigger_set_updated_at() OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: administradores; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.administradores (
    id uuid NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    telefono character varying(20),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.administradores OWNER TO admin;

--
-- Name: calificaciones; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.calificaciones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cliente_id uuid NOT NULL,
    reservacion_id uuid NOT NULL,
    tipo_servicio character varying(50) NOT NULL,
    servicio_envio_id uuid,
    ruta_transporte_id uuid,
    puntuacion integer NOT NULL,
    comentario text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT calificaciones_puntuacion_check CHECK (((puntuacion >= 1) AND (puntuacion <= 5)))
);


ALTER TABLE public.calificaciones OWNER TO admin;

--
-- Name: carrito_compras; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.carrito_compras (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cliente_id uuid NOT NULL,
    tipo_servicio character varying(50) NOT NULL,
    servicio_envio_id uuid,
    ruta_transporte_id uuid,
    fecha_inicio date NOT NULL,
    fecha_fin date,
    cantidad integer DEFAULT 1 NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    cupon_id uuid,
    descuento numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_tipo_servicio CHECK (((((tipo_servicio)::text = 'envio'::text) AND (servicio_envio_id IS NOT NULL) AND (ruta_transporte_id IS NULL)) OR (((tipo_servicio)::text = 'transporte'::text) AND (ruta_transporte_id IS NOT NULL) AND (servicio_envio_id IS NULL))))
);


ALTER TABLE public.carrito_compras OWNER TO admin;

--
-- Name: clientes; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.clientes (
    id uuid NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    telefono character varying(20) NOT NULL,
    direccion_origen text,
    foto_perfil text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.clientes OWNER TO admin;

--
-- Name: cupones; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cupones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    creado_por uuid NOT NULL,
    codigo character varying(50) NOT NULL,
    descripcion text,
    tipo_descuento public.coupon_discount_type NOT NULL,
    valor_descuento numeric(10,2) NOT NULL,
    monto_minimo numeric(10,2),
    usos_maximos integer,
    usos_actuales integer DEFAULT 0 NOT NULL,
    uso_por_cliente integer DEFAULT 1,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    estado public.coupon_status DEFAULT 'activo'::public.coupon_status NOT NULL,
    tipo_servicio character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cupones OWNER TO admin;

--
-- Name: cupones_clientes; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cupones_clientes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cupon_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    canjeado boolean DEFAULT false NOT NULL,
    fecha_canje timestamp with time zone,
    reservacion_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cupones_clientes OWNER TO admin;

--
-- Name: empresas_transporte; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.empresas_transporte (
    id uuid NOT NULL,
    nombre_empresa character varying(255) NOT NULL,
    telefono character varying(20) NOT NULL,
    telefono_respaldo character varying(20),
    nit character varying(20) NOT NULL,
    numero_licencia_operativa character varying(50) NOT NULL,
    logo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.empresas_transporte OWNER TO admin;

--
-- Name: evidencias_reporte; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.evidencias_reporte (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reporte_id uuid NOT NULL,
    url_archivo text NOT NULL,
    tipo_archivo character varying(20) NOT NULL,
    descripcion character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.evidencias_reporte OWNER TO admin;

--
-- Name: flota_vehiculos; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.flota_vehiculos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    tipo_vehiculo character varying(100) NOT NULL,
    placa character varying(20) NOT NULL,
    capacidad integer NOT NULL,
    modelo character varying(100),
    anio integer,
    estado character varying(50) DEFAULT 'disponible'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.flota_vehiculos OWNER TO admin;

--
-- Name: fotos_servicio; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.fotos_servicio (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    servicio_id uuid NOT NULL,
    url_foto text NOT NULL,
    descripcion character varying(255),
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fotos_servicio OWNER TO admin;

--
-- Name: log_actividad; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.log_actividad (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid,
    accion character varying(100) NOT NULL,
    descripcion text,
    entidad_tipo character varying(50),
    entidad_id uuid,
    ip_address inet,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.log_actividad OWNER TO admin;

--
-- Name: metodos_pago; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.metodos_pago (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cliente_id uuid NOT NULL,
    tipo public.payment_method_type NOT NULL,
    numero_tarjeta character varying(20),
    nombre_tarjeta character varying(255),
    fecha_vencimiento character varying(7),
    cvv_hash character varying(255),
    wallet_id character varying(100),
    saldo numeric(12,2) DEFAULT 1000.00 NOT NULL,
    es_predeterminado boolean DEFAULT false NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.metodos_pago OWNER TO admin;

--
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.notificaciones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    tipo public.notification_type NOT NULL,
    titulo character varying(255) NOT NULL,
    mensaje text NOT NULL,
    leida boolean DEFAULT false NOT NULL,
    entidad_tipo character varying(50),
    entidad_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notificaciones OWNER TO admin;

--
-- Name: operadores_logisticos; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.operadores_logisticos (
    id uuid NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    dpi_cui character varying(20) NOT NULL,
    telefono character varying(20) NOT NULL,
    telefono_respaldo character varying(20),
    fotografia text NOT NULL,
    zona_operacion character varying(255) NOT NULL,
    genero public.gender_type NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.operadores_logisticos OWNER TO admin;

--
-- Name: pagos; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.pagos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reservacion_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    metodo_pago_id uuid NOT NULL,
    monto numeric(10,2) NOT NULL,
    estado public.payment_status DEFAULT 'pendiente'::public.payment_status NOT NULL,
    referencia character varying(100),
    monto_reembolso numeric(10,2),
    fecha_reembolso timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pagos OWNER TO admin;

--
-- Name: reportes; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.reportes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reportado_por uuid NOT NULL,
    reportado_usuario uuid NOT NULL,
    tipo_servicio character varying(50) NOT NULL,
    servicio_id uuid,
    reservacion_id uuid,
    motivo character varying(255) NOT NULL,
    descripcion text NOT NULL,
    estado public.report_status DEFAULT 'enviado'::public.report_status NOT NULL,
    revisado_por uuid,
    resolucion text,
    sancion_aplicada text,
    fecha_resolucion timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    evidencia text,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    respuesta_empresa text
);


ALTER TABLE public.reportes OWNER TO admin;

--
-- Name: reservaciones; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.reservaciones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cliente_id uuid NOT NULL,
    tipo_servicio character varying(50) NOT NULL,
    servicio_envio_id uuid,
    ruta_transporte_id uuid,
    estado public.booking_status DEFAULT 'pendiente_pago'::public.booking_status NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date,
    direccion_origen text,
    direccion_destino text,
    descripcion_paquete text,
    peso_paquete_kg numeric(10,2),
    precio_total numeric(10,2) NOT NULL,
    comision_plataforma numeric(10,2) NOT NULL,
    ganancia_proveedor numeric(10,2) NOT NULL,
    descuento_aplicado numeric(10,2) DEFAULT 0,
    fecha_cancelacion timestamp with time zone,
    motivo_cancelacion text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_reservacion_servicio CHECK (((((tipo_servicio)::text = 'envio'::text) AND (servicio_envio_id IS NOT NULL) AND (ruta_transporte_id IS NULL)) OR (((tipo_servicio)::text = 'transporte'::text) AND (ruta_transporte_id IS NOT NULL) AND (servicio_envio_id IS NULL))))
);


ALTER TABLE public.reservaciones OWNER TO admin;

--
-- Name: respuestas_calificacion; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.respuestas_calificacion (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    calificacion_id uuid NOT NULL,
    operador_id uuid NOT NULL,
    respuesta text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.respuestas_calificacion OWNER TO admin;

--
-- Name: rutas_transporte; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.rutas_transporte (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    nombre_ruta character varying(255) NOT NULL,
    origen character varying(255) NOT NULL,
    destino character varying(255) NOT NULL,
    tipo_servicio character varying(100) NOT NULL,
    precio numeric(10,2) NOT NULL,
    tiempo_estimado character varying(100),
    hora_salida time without time zone,
    hora_llegada_estimada time without time zone,
    dias_disponibles character varying(100),
    capacidad_pasajeros integer,
    estado public.route_status DEFAULT 'activa'::public.route_status NOT NULL,
    motivo_cancelacion text,
    calificacion_promedio numeric(3,2) DEFAULT 0,
    total_calificaciones integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rutas_transporte OWNER TO admin;

--
-- Name: servicios_envio; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.servicios_envio (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    operador_id uuid NOT NULL,
    nombre_servicio character varying(255) NOT NULL,
    descripcion text,
    zona_cobertura character varying(255) NOT NULL,
    capacidad_carga_kg numeric(10,2) NOT NULL,
    precio_envio numeric(10,2) NOT NULL,
    estado public.service_status DEFAULT 'activo'::public.service_status NOT NULL,
    tiempo_estimado_entrega character varying(100),
    tipo_vehiculo character varying(100),
    horario_disponible character varying(255),
    calificacion_promedio numeric(3,2) DEFAULT 0,
    total_calificaciones integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.servicios_envio OWNER TO admin;

--
-- Name: sesiones; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.sesiones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    refresh_token character varying(500) NOT NULL,
    ip_address inet,
    user_agent text,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sesiones OWNER TO admin;

--
-- Name: solicitudes_cambio_perfil; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.solicitudes_cambio_perfil (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    campos_nuevos jsonb NOT NULL,
    campos_previos jsonb NOT NULL,
    estado public.profile_change_status DEFAULT 'pendiente'::public.profile_change_status NOT NULL,
    revisado_por uuid,
    motivo_rechazo text,
    fecha_resolucion timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.solicitudes_cambio_perfil OWNER TO admin;

--
-- Name: solicitudes_registro; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.solicitudes_registro (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    estado public.registration_request_status DEFAULT 'pendiente'::public.registration_request_status NOT NULL,
    reunion_fecha timestamp with time zone,
    reunion_enlace text,
    reunion_agendada boolean DEFAULT false NOT NULL,
    revisado_por uuid,
    motivo_rechazo text,
    fecha_resolucion timestamp with time zone,
    notas text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.solicitudes_registro OWNER TO admin;

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol public.user_role NOT NULL,
    estado public.user_status DEFAULT 'pendiente_verificacion'::public.user_status NOT NULL,
    email_verificado boolean DEFAULT false NOT NULL,
    token_verificacion character varying(6),
    token_verificacion_exp timestamp with time zone,
    token_2fa character varying(6),
    token_2fa_exp timestamp with time zone,
    requiere_cambio_password boolean DEFAULT false NOT NULL,
    motivo_veto text,
    fecha_veto timestamp with time zone,
    vetado_por uuid,
    suspendido_hasta timestamp with time zone,
    motivo_suspension text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.usuarios OWNER TO admin;

--
-- Name: administradores administradores_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_pkey PRIMARY KEY (id);


--
-- Name: calificaciones calificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_pkey PRIMARY KEY (id);


--
-- Name: carrito_compras carrito_compras_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.carrito_compras
    ADD CONSTRAINT carrito_compras_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: cupones_clientes cupones_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cupones_clientes
    ADD CONSTRAINT cupones_clientes_pkey PRIMARY KEY (id);


--
-- Name: cupones cupones_codigo_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cupones
    ADD CONSTRAINT cupones_codigo_key UNIQUE (codigo);


--
-- Name: cupones cupones_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cupones
    ADD CONSTRAINT cupones_pkey PRIMARY KEY (id);


--
-- Name: empresas_transporte empresas_transporte_nit_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.empresas_transporte
    ADD CONSTRAINT empresas_transporte_nit_key UNIQUE (nit);


--
-- Name: empresas_transporte empresas_transporte_numero_licencia_operativa_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.empresas_transporte
    ADD CONSTRAINT empresas_transporte_numero_licencia_operativa_key UNIQUE (numero_licencia_operativa);


--
-- Name: empresas_transporte empresas_transporte_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.empresas_transporte
    ADD CONSTRAINT empresas_transporte_pkey PRIMARY KEY (id);


--
-- Name: evidencias_reporte evidencias_reporte_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.evidencias_reporte
    ADD CONSTRAINT evidencias_reporte_pkey PRIMARY KEY (id);


--
-- Name: flota_vehiculos flota_vehiculos_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.flota_vehiculos
    ADD CONSTRAINT flota_vehiculos_pkey PRIMARY KEY (id);


--
-- Name: flota_vehiculos flota_vehiculos_placa_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.flota_vehiculos
    ADD CONSTRAINT flota_vehiculos_placa_key UNIQUE (placa);


--
-- Name: fotos_servicio fotos_servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.fotos_servicio
    ADD CONSTRAINT fotos_servicio_pkey PRIMARY KEY (id);


--
-- Name: log_actividad log_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.log_actividad
    ADD CONSTRAINT log_actividad_pkey PRIMARY KEY (id);


--
-- Name: metodos_pago metodos_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_pkey PRIMARY KEY (id);


--
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- Name: operadores_logisticos operadores_logisticos_dpi_cui_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.operadores_logisticos
    ADD CONSTRAINT operadores_logisticos_dpi_cui_key UNIQUE (dpi_cui);


--
-- Name: operadores_logisticos operadores_logisticos_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.operadores_logisticos
    ADD CONSTRAINT operadores_logisticos_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_referencia_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_referencia_key UNIQUE (referencia);


--
-- Name: reportes reportes_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_pkey PRIMARY KEY (id);


--
-- Name: reservaciones reservaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reservaciones
    ADD CONSTRAINT reservaciones_pkey PRIMARY KEY (id);


--
-- Name: respuestas_calificacion respuestas_calificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.respuestas_calificacion
    ADD CONSTRAINT respuestas_calificacion_pkey PRIMARY KEY (id);


--
-- Name: rutas_transporte rutas_transporte_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rutas_transporte
    ADD CONSTRAINT rutas_transporte_pkey PRIMARY KEY (id);


--
-- Name: servicios_envio servicios_envio_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.servicios_envio
    ADD CONSTRAINT servicios_envio_pkey PRIMARY KEY (id);


--
-- Name: sesiones sesiones_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sesiones
    ADD CONSTRAINT sesiones_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_cambio_perfil solicitudes_cambio_perfil_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.solicitudes_cambio_perfil
    ADD CONSTRAINT solicitudes_cambio_perfil_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_registro solicitudes_registro_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.solicitudes_registro
    ADD CONSTRAINT solicitudes_registro_pkey PRIMARY KEY (id);


--
-- Name: calificaciones uq_calificacion_reservacion; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT uq_calificacion_reservacion UNIQUE (cliente_id, reservacion_id);


--
-- Name: cupones_clientes uq_cupon_cliente; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cupones_clientes
    ADD CONSTRAINT uq_cupon_cliente UNIQUE (cupon_id, cliente_id);


--
-- Name: respuestas_calificacion uq_respuesta_calificacion; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.respuestas_calificacion
    ADD CONSTRAINT uq_respuesta_calificacion UNIQUE (calificacion_id, operador_id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_calificaciones_cliente; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_calificaciones_cliente ON public.calificaciones USING btree (cliente_id);


--
-- Name: idx_calificaciones_ruta; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_calificaciones_ruta ON public.calificaciones USING btree (ruta_transporte_id);


--
-- Name: idx_calificaciones_servicio; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_calificaciones_servicio ON public.calificaciones USING btree (servicio_envio_id);


--
-- Name: idx_cambio_perfil_estado; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_cambio_perfil_estado ON public.solicitudes_cambio_perfil USING btree (estado);


--
-- Name: idx_cambio_perfil_usuario; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_cambio_perfil_usuario ON public.solicitudes_cambio_perfil USING btree (usuario_id);


--
-- Name: idx_carrito_cliente; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_carrito_cliente ON public.carrito_compras USING btree (cliente_id);


--
-- Name: idx_cupones_clientes_cliente; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_cupones_clientes_cliente ON public.cupones_clientes USING btree (cliente_id);


--
-- Name: idx_cupones_clientes_cupon; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_cupones_clientes_cupon ON public.cupones_clientes USING btree (cupon_id);


--
-- Name: idx_cupones_codigo; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_cupones_codigo ON public.cupones USING btree (codigo);


--
-- Name: idx_cupones_creador; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_cupones_creador ON public.cupones USING btree (creado_por);


--
-- Name: idx_cupones_estado; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_cupones_estado ON public.cupones USING btree (estado);


--
-- Name: idx_evidencias_reporte; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_evidencias_reporte ON public.evidencias_reporte USING btree (reporte_id);


--
-- Name: idx_flota_empresa; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_flota_empresa ON public.flota_vehiculos USING btree (empresa_id);


--
-- Name: idx_fotos_servicio; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fotos_servicio ON public.fotos_servicio USING btree (servicio_id);


--
-- Name: idx_log_accion; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_log_accion ON public.log_actividad USING btree (accion);


--
-- Name: idx_log_created; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_log_created ON public.log_actividad USING btree (created_at);


--
-- Name: idx_log_usuario; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_log_usuario ON public.log_actividad USING btree (usuario_id);


--
-- Name: idx_metodos_pago_cliente; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_metodos_pago_cliente ON public.metodos_pago USING btree (cliente_id);


--
-- Name: idx_notificaciones_created; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_notificaciones_created ON public.notificaciones USING btree (created_at DESC);


--
-- Name: idx_notificaciones_leida; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_notificaciones_leida ON public.notificaciones USING btree (usuario_id, leida);


--
-- Name: idx_notificaciones_usuario; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_notificaciones_usuario ON public.notificaciones USING btree (usuario_id);


--
-- Name: idx_pagos_cliente; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_pagos_cliente ON public.pagos USING btree (cliente_id);


--
-- Name: idx_pagos_estado; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_pagos_estado ON public.pagos USING btree (estado);


--
-- Name: idx_pagos_reservacion; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_pagos_reservacion ON public.pagos USING btree (reservacion_id);


--
-- Name: idx_reportes_estado; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_reportes_estado ON public.reportes USING btree (estado);


--
-- Name: idx_reportes_reportado_por; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_reportes_reportado_por ON public.reportes USING btree (reportado_por);


--
-- Name: idx_reportes_reportado_usuario; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_reportes_reportado_usuario ON public.reportes USING btree (reportado_usuario);


--
-- Name: idx_reservaciones_cliente; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_reservaciones_cliente ON public.reservaciones USING btree (cliente_id);


--
-- Name: idx_reservaciones_estado; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_reservaciones_estado ON public.reservaciones USING btree (estado);


--
-- Name: idx_reservaciones_fechas; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_reservaciones_fechas ON public.reservaciones USING btree (fecha_inicio, fecha_fin);


--
-- Name: idx_reservaciones_ruta; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_reservaciones_ruta ON public.reservaciones USING btree (ruta_transporte_id);


--
-- Name: idx_reservaciones_servicio; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_reservaciones_servicio ON public.reservaciones USING btree (servicio_envio_id);


--
-- Name: idx_rutas_destino; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_rutas_destino ON public.rutas_transporte USING btree (destino);


--
-- Name: idx_rutas_empresa; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_rutas_empresa ON public.rutas_transporte USING btree (empresa_id);


--
-- Name: idx_rutas_estado; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_rutas_estado ON public.rutas_transporte USING btree (estado);


--
-- Name: idx_rutas_precio; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_rutas_precio ON public.rutas_transporte USING btree (precio);


--
-- Name: idx_servicios_calificacion; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_servicios_calificacion ON public.servicios_envio USING btree (calificacion_promedio DESC);


--
-- Name: idx_servicios_estado; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_servicios_estado ON public.servicios_envio USING btree (estado);


--
-- Name: idx_servicios_operador; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_servicios_operador ON public.servicios_envio USING btree (operador_id);


--
-- Name: idx_servicios_precio; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_servicios_precio ON public.servicios_envio USING btree (precio_envio);


--
-- Name: idx_servicios_zona; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_servicios_zona ON public.servicios_envio USING btree (zona_cobertura);


--
-- Name: idx_sesiones_token; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_sesiones_token ON public.sesiones USING btree (refresh_token);


--
-- Name: idx_sesiones_usuario; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_sesiones_usuario ON public.sesiones USING btree (usuario_id);


--
-- Name: idx_solicitudes_estado; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_solicitudes_estado ON public.solicitudes_registro USING btree (estado);


--
-- Name: idx_solicitudes_usuario; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_solicitudes_usuario ON public.solicitudes_registro USING btree (usuario_id);


--
-- Name: idx_usuarios_email; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: idx_usuarios_estado; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_usuarios_estado ON public.usuarios USING btree (estado);


--
-- Name: idx_usuarios_rol; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_usuarios_rol ON public.usuarios USING btree (rol);


--
-- Name: administradores set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.administradores FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: calificaciones set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.calificaciones FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: carrito_compras set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.carrito_compras FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: clientes set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: cupones set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cupones FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: empresas_transporte set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.empresas_transporte FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: flota_vehiculos set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.flota_vehiculos FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: metodos_pago set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.metodos_pago FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: operadores_logisticos set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.operadores_logisticos FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: pagos set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pagos FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: reportes set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.reportes FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: reservaciones set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.reservaciones FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: rutas_transporte set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.rutas_transporte FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: servicios_envio set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.servicios_envio FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: solicitudes_cambio_perfil set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.solicitudes_cambio_perfil FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: solicitudes_registro set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.solicitudes_registro FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: usuarios set_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: calificaciones trigger_actualizar_calificacion_ruta; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_actualizar_calificacion_ruta AFTER INSERT OR DELETE OR UPDATE ON public.calificaciones FOR EACH ROW EXECUTE FUNCTION public.actualizar_calificacion_ruta();


--
-- Name: calificaciones trigger_actualizar_calificacion_servicio; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER trigger_actualizar_calificacion_servicio AFTER INSERT OR DELETE OR UPDATE ON public.calificaciones FOR EACH ROW EXECUTE FUNCTION public.actualizar_calificacion_servicio();


--
-- Name: administradores administradores_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_id_fkey FOREIGN KEY (id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: calificaciones calificaciones_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: calificaciones calificaciones_reservacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_reservacion_id_fkey FOREIGN KEY (reservacion_id) REFERENCES public.reservaciones(id) ON DELETE CASCADE;


--
-- Name: calificaciones calificaciones_ruta_transporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_ruta_transporte_id_fkey FOREIGN KEY (ruta_transporte_id) REFERENCES public.rutas_transporte(id);


--
-- Name: calificaciones calificaciones_servicio_envio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_servicio_envio_id_fkey FOREIGN KEY (servicio_envio_id) REFERENCES public.servicios_envio(id);


--
-- Name: carrito_compras carrito_compras_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.carrito_compras
    ADD CONSTRAINT carrito_compras_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: carrito_compras carrito_compras_ruta_transporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.carrito_compras
    ADD CONSTRAINT carrito_compras_ruta_transporte_id_fkey FOREIGN KEY (ruta_transporte_id) REFERENCES public.rutas_transporte(id) ON DELETE CASCADE;


--
-- Name: carrito_compras carrito_compras_servicio_envio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.carrito_compras
    ADD CONSTRAINT carrito_compras_servicio_envio_id_fkey FOREIGN KEY (servicio_envio_id) REFERENCES public.servicios_envio(id) ON DELETE CASCADE;


--
-- Name: clientes clientes_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_id_fkey FOREIGN KEY (id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: cupones_clientes cupones_clientes_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cupones_clientes
    ADD CONSTRAINT cupones_clientes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: cupones_clientes cupones_clientes_cupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cupones_clientes
    ADD CONSTRAINT cupones_clientes_cupon_id_fkey FOREIGN KEY (cupon_id) REFERENCES public.cupones(id) ON DELETE CASCADE;


--
-- Name: cupones_clientes cupones_clientes_reservacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cupones_clientes
    ADD CONSTRAINT cupones_clientes_reservacion_id_fkey FOREIGN KEY (reservacion_id) REFERENCES public.reservaciones(id);


--
-- Name: cupones cupones_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cupones
    ADD CONSTRAINT cupones_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: empresas_transporte empresas_transporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.empresas_transporte
    ADD CONSTRAINT empresas_transporte_id_fkey FOREIGN KEY (id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: evidencias_reporte evidencias_reporte_reporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.evidencias_reporte
    ADD CONSTRAINT evidencias_reporte_reporte_id_fkey FOREIGN KEY (reporte_id) REFERENCES public.reportes(id) ON DELETE CASCADE;


--
-- Name: carrito_compras fk_carrito_cupon; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.carrito_compras
    ADD CONSTRAINT fk_carrito_cupon FOREIGN KEY (cupon_id) REFERENCES public.cupones(id);


--
-- Name: flota_vehiculos flota_vehiculos_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.flota_vehiculos
    ADD CONSTRAINT flota_vehiculos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_transporte(id) ON DELETE CASCADE;


--
-- Name: fotos_servicio fotos_servicio_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.fotos_servicio
    ADD CONSTRAINT fotos_servicio_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicios_envio(id) ON DELETE CASCADE;


--
-- Name: log_actividad log_actividad_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.log_actividad
    ADD CONSTRAINT log_actividad_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: metodos_pago metodos_pago_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: notificaciones notificaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: operadores_logisticos operadores_logisticos_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.operadores_logisticos
    ADD CONSTRAINT operadores_logisticos_id_fkey FOREIGN KEY (id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: pagos pagos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: pagos pagos_metodo_pago_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_metodo_pago_id_fkey FOREIGN KEY (metodo_pago_id) REFERENCES public.metodos_pago(id);


--
-- Name: pagos pagos_reservacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_reservacion_id_fkey FOREIGN KEY (reservacion_id) REFERENCES public.reservaciones(id) ON DELETE CASCADE;


--
-- Name: reportes reportes_reportado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_reportado_por_fkey FOREIGN KEY (reportado_por) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: reportes reportes_reportado_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_reportado_usuario_fkey FOREIGN KEY (reportado_usuario) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: reportes reportes_revisado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_revisado_por_fkey FOREIGN KEY (revisado_por) REFERENCES public.usuarios(id);


--
-- Name: reservaciones reservaciones_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reservaciones
    ADD CONSTRAINT reservaciones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: reservaciones reservaciones_ruta_transporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reservaciones
    ADD CONSTRAINT reservaciones_ruta_transporte_id_fkey FOREIGN KEY (ruta_transporte_id) REFERENCES public.rutas_transporte(id);


--
-- Name: reservaciones reservaciones_servicio_envio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reservaciones
    ADD CONSTRAINT reservaciones_servicio_envio_id_fkey FOREIGN KEY (servicio_envio_id) REFERENCES public.servicios_envio(id);


--
-- Name: respuestas_calificacion respuestas_calificacion_calificacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.respuestas_calificacion
    ADD CONSTRAINT respuestas_calificacion_calificacion_id_fkey FOREIGN KEY (calificacion_id) REFERENCES public.calificaciones(id) ON DELETE CASCADE;


--
-- Name: respuestas_calificacion respuestas_calificacion_operador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.respuestas_calificacion
    ADD CONSTRAINT respuestas_calificacion_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.operadores_logisticos(id) ON DELETE CASCADE;


--
-- Name: rutas_transporte rutas_transporte_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rutas_transporte
    ADD CONSTRAINT rutas_transporte_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_transporte(id) ON DELETE CASCADE;


--
-- Name: servicios_envio servicios_envio_operador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.servicios_envio
    ADD CONSTRAINT servicios_envio_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.operadores_logisticos(id) ON DELETE CASCADE;


--
-- Name: sesiones sesiones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sesiones
    ADD CONSTRAINT sesiones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: solicitudes_cambio_perfil solicitudes_cambio_perfil_revisado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.solicitudes_cambio_perfil
    ADD CONSTRAINT solicitudes_cambio_perfil_revisado_por_fkey FOREIGN KEY (revisado_por) REFERENCES public.usuarios(id);


--
-- Name: solicitudes_cambio_perfil solicitudes_cambio_perfil_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.solicitudes_cambio_perfil
    ADD CONSTRAINT solicitudes_cambio_perfil_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: solicitudes_registro solicitudes_registro_revisado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.solicitudes_registro
    ADD CONSTRAINT solicitudes_registro_revisado_por_fkey FOREIGN KEY (revisado_por) REFERENCES public.usuarios(id);


--
-- Name: solicitudes_registro solicitudes_registro_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.solicitudes_registro
    ADD CONSTRAINT solicitudes_registro_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict N0G5AzZjggyF6f6B7YKWjvxrQeZeDsn9SD8nn0Snm9hEnRBz1mhvHrvN0ZJ7VTY


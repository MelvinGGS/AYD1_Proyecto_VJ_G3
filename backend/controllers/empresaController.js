const db = require("../config/db");
const { enviarCorreo } = require("../utils/mailer");
// todo para el perfil

// para obtener perfil de la empresa
const obtenerPerfil = async (req, res) => {
    const empresaId = req.usuario.id;
    try {
        const { rows } = await db.pool.query(
            `SELECT e.nombre_empresa, e.telefono, e.telefono_respaldo, 
              e.nit, e.numero_licencia_operativa, e.logo, u.email
       FROM empresas_transporte e
       INNER JOIN usuarios u ON u.id = e.id
       WHERE e.id = $1`,
            [empresaId]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Empresa no encontrada." });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener perfil.", error: { details: error.message } });
    }
};

// para solicitar cambio de perfil
const solicitarCambioPerfil = async (req, res) => {
    const empresaId = req.usuario.id;
    const { nombre_empresa, telefono, telefono_respaldo } = req.body;

    if (!nombre_empresa || !telefono) {
        return res.status(400).json({ success: false, message: "El nombre y teléfono son requeridos." });
    }

    try {
        const { rows } = await db.pool.query(
            "SELECT nombre_empresa, telefono, telefono_respaldo FROM empresas_transporte WHERE id = $1",
            [empresaId]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Empresa no encontrada." });

        const camposPrevios = rows[0];
        const camposNuevos = { nombre_empresa, telefono, telefono_respaldo };

        await db.pool.query(
            `INSERT INTO solicitudes_cambio_perfil (usuario_id, campos_nuevos, campos_previos)
       VALUES ($1, $2, $3)`,
            [empresaId, JSON.stringify(camposNuevos), JSON.stringify(camposPrevios)]
        );

        res.status(201).json({ success: true, message: "Solicitud de cambio enviada. Pendiente de aprobación del administrador." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al solicitar cambio.", error: { details: error.message } });
    }
};

// para ver historial de solicitudes de cambio de perfil
const verSolicitudesCambio = async (req, res) => {
    const empresaId = req.usuario.id;
    try {
        const { rows } = await db.pool.query(
            `SELECT id, campos_nuevos, campos_previos, estado, motivo_rechazo, fecha_resolucion, created_at
       FROM solicitudes_cambio_perfil
       WHERE usuario_id = $1
       ORDER BY created_at DESC`,
            [empresaId]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener solicitudes.", error: { details: error.message } });
    }
};

// todo lo de cupones

// Crear cupón
const crearCupon = async (req, res) => {
    const empresaId = req.usuario.id;
    const { codigo, descripcion, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin, usos_maximos, monto_minimo } = req.body;

    if (!codigo || !tipo_descuento || !valor_descuento || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ success: false, message: "Faltan campos obligatorios." });
    }

    try {
        const { rows } = await db.pool.query(
            `INSERT INTO cupones (creado_por, codigo, descripcion, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin, usos_maximos, monto_minimo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [empresaId, codigo.toUpperCase(), descripcion, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin, usos_maximos || null, monto_minimo || null]
        );
        res.status(201).json({ success: true, message: "Cupón creado exitosamente.", data: rows[0] });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ success: false, message: "Ya existe un cupón con ese código." });
        }
        res.status(500).json({ success: false, message: "Error al crear cupón.", error: { details: error.message } });
    }
};

// para listar cupones de la empresa
const listarCupones = async (req, res) => {
    const empresaId = req.usuario.id;
    try {
        const { rows } = await db.pool.query(
            `SELECT id, codigo, descripcion, tipo_descuento, valor_descuento,
              fecha_inicio, fecha_fin, usos_maximos, usos_actuales, estado
       FROM cupones
       WHERE creado_por = $1
       ORDER BY created_at DESC`,
            [empresaId]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al listar cupones.", error: { details: error.message } });
    }
};

// para desactivar cupón
const desactivarCupon = async (req, res) => {
    const empresaId = req.usuario.id;
    const { id } = req.params;
    try {
        const { rows } = await db.pool.query(
            "UPDATE cupones SET estado = 'expirado' WHERE id = $1 AND creado_por = $2 RETURNING id",
            [id, empresaId]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Cupón no encontrado." });
        res.json({ success: true, message: "Cupón desactivado." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al desactivar cupón.", error: { details: error.message } });
    }
};


const enviarCuponPorCorreo = async (req, res) => {
    const empresaId = req.usuario.id;
    const { id } = req.params;
    const { correo_cliente } = req.body;

    if (!correo_cliente) {
        return res.status(400).json({ success: false, message: "El correo del cliente es requerido." });
    }

    try {
        const { rows } = await db.pool.query(
            `SELECT * FROM cupones WHERE id = $1 AND creado_por = $2 AND estado = 'activo'`,
            [id, empresaId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Cupón no encontrado o inactivo." });
        }

        const cupon = rows[0];

        await enviarCorreo(
            correo_cliente,
            `¡Tienes un cupón de descuento! - TrackFlow-HUB`,
            "Cupón de Descuento",
            `Hemos recibido un cupón especial para ti. Usa el siguiente código al momento de realizar tu reservación:
      <br><br>
      <b>Código:</b> ${cupon.codigo}<br>
      <b>Descuento:</b> ${cupon.tipo_descuento === "porcentaje" ? `${cupon.valor_descuento}%` : `Q${cupon.valor_descuento}`}<br>
      <b>Válido hasta:</b> ${new Date(cupon.fecha_fin).toLocaleDateString()}<br>
      ${cupon.descripcion ? `<b>Descripción:</b> ${cupon.descripcion}` : ""}`,
            cupon.codigo
        );

        res.json({ success: true, message: `Cupón enviado exitosamente a ${correo_cliente}.` });
    } catch (error) {
        console.error("Error al enviar cupón:", error);
        res.status(500).json({ success: false, message: "Error al enviar cupón.", error: { details: error.message } });
    }
};

// para los reportes recibidos 
const verReportesRecibidos = async (req, res) => {
    const empresaId = req.usuario.id;
    try {
        const { rows } = await db.pool.query(
            `SELECT 
        r.id,
        r.motivo,
        r.descripcion,
        r.estado,
        r.tipo_servicio,
        r.created_at,
        u.email AS cliente_email
       FROM reportes r
       INNER JOIN usuarios u ON u.id = r.reportado_por
       WHERE r.reportado_usuario = $1
       ORDER BY r.created_at DESC`,
            [empresaId]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error al obtener reportes:", error);
        res.status(500).json({ success: false, message: "Error al obtener reportes.", error: { details: error.message } });
    }
};

// para los reportes
// Reporte de ganancias
const reporteGanancias = async (req, res) => {
    const empresaId = req.usuario.id;
    try {
        const { rows } = await db.pool.query(
            `SELECT 
        rt.nombre_ruta,
        rt.origen,
        rt.destino,
        COUNT(r.id) AS total_reservaciones,
        SUM(r.precio_total) AS ingresos_totales,
        SUM(r.ganancia_proveedor) AS ganancias_empresa,
        SUM(r.comision_plataforma) AS comision_plataforma
       FROM rutas_transporte rt
       LEFT JOIN reservaciones r ON r.ruta_transporte_id = rt.id
         AND r.estado NOT IN ('cancelado', 'reembolsado')
       WHERE rt.empresa_id = $1
       GROUP BY rt.id, rt.nombre_ruta, rt.origen, rt.destino
       ORDER BY ganancias_empresa DESC NULLS LAST`,
            [empresaId]
        );

        const totales = rows.reduce((acc, r) => ({
            total_reservaciones: acc.total_reservaciones + parseInt(r.total_reservaciones || 0),
            ingresos_totales: acc.ingresos_totales + parseFloat(r.ingresos_totales || 0),
            ganancias_empresa: acc.ganancias_empresa + parseFloat(r.ganancias_empresa || 0),
            comision_plataforma: acc.comision_plataforma + parseFloat(r.comision_plataforma || 0)
        }), { total_reservaciones: 0, ingresos_totales: 0, ganancias_empresa: 0, comision_plataforma: 0 });

        res.json({ success: true, data: rows, totales });
    } catch (error) {
        console.error("Error en reporte ganancias:", error);
        res.status(500).json({ success: false, message: "Error al obtener reporte de ganancias.", error: { details: error.message } });
    }
};

// Historial de servicios contratados
const historialServicios = async (req, res) => {
    const empresaId = req.usuario.id;
    try {
        const { rows } = await db.pool.query(
            `SELECT 
        r.id,
        r.estado,
        r.fecha_inicio,
        r.fecha_fin,
        r.precio_total,
        r.ganancia_proveedor,
        r.created_at,
        rt.nombre_ruta,
        rt.origen,
        rt.destino,
        u.email AS cliente_email
       FROM reservaciones r
       INNER JOIN rutas_transporte rt ON rt.id = r.ruta_transporte_id
       INNER JOIN clientes c ON c.id = r.cliente_id
       INNER JOIN usuarios u ON u.id = c.id
       WHERE rt.empresa_id = $1
       ORDER BY r.created_at DESC`,
            [empresaId]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en historial servicios:", error);
        res.status(500).json({ success: false, message: "Error al obtener historial.", error: { details: error.message } });
    }
};

// Reporte de calificaciones y reseñas
const reporteCalificaciones = async (req, res) => {
    const empresaId = req.usuario.id;
    try {
        const { rows } = await db.pool.query(
            `SELECT 
        c.id,
        c.puntuacion,
        c.comentario,
        c.created_at,
        rt.nombre_ruta,
        u.email AS cliente_email
       FROM calificaciones c
       INNER JOIN rutas_transporte rt ON rt.id = c.ruta_transporte_id
       INNER JOIN clientes cl ON cl.id = c.cliente_id
       INNER JOIN usuarios u ON u.id = cl.id
       WHERE rt.empresa_id = $1
       ORDER BY c.created_at DESC`,
            [empresaId]
        );

        const promedio = rows.length > 0
            ? (rows.reduce((acc, r) => acc + r.puntuacion, 0) / rows.length).toFixed(1)
            : 0;

        res.json({ success: true, data: rows, promedio_general: promedio });
    } catch (error) {
        console.error("Error en reporte calificaciones:", error);
        res.status(500).json({ success: false, message: "Error al obtener calificaciones.", error: { details: error.message } });
    }
};

// Reporte del estado de las rutas
const reporteEstadoRutas = async (req, res) => {
    const empresaId = req.usuario.id;
    try {
        const { rows } = await db.pool.query(
            `SELECT 
        rt.id,
        rt.nombre_ruta,
        rt.origen,
        rt.destino,
        rt.precio,
        rt.estado,
        rt.tiempo_estimado,
        COUNT(r.id) AS total_reservaciones,
        AVG(cal.puntuacion) AS calificacion_promedio
       FROM rutas_transporte rt
       LEFT JOIN reservaciones r ON r.ruta_transporte_id = rt.id
       LEFT JOIN calificaciones cal ON cal.ruta_transporte_id = rt.id
       WHERE rt.empresa_id = $1
       GROUP BY rt.id
       ORDER BY rt.estado, rt.nombre_ruta`,
            [empresaId]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en reporte estado rutas:", error);
        res.status(500).json({ success: false, message: "Error al obtener estado de rutas.", error: { details: error.message } });
    }
};

module.exports = {
    obtenerPerfil,
    solicitarCambioPerfil,
    verSolicitudesCambio,
    crearCupon,
    listarCupones,
    desactivarCupon,
    enviarCuponPorCorreo,
    verReportesRecibidos,
    reporteGanancias,
    historialServicios,
    reporteCalificaciones,
    reporteEstadoRutas
};
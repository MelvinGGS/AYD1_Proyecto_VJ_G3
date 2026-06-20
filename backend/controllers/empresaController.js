const db = require("../config/db");

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


module.exports = {
    obtenerPerfil,
    solicitarCambioPerfil,
    verSolicitudesCambio,
    crearCupon,
    listarCupones,
    desactivarCupon
};
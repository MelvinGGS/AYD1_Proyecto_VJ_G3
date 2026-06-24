const db = require("../config/db");

const decodeEscapedUnicode = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_match, grp) => String.fromCharCode(parseInt(grp, 16)));
};

const obtenerPerfil = async (req, res) => {
  const operadorId = req.usuario.id;
  try {
    const { rows } = await db.pool.query(
      `SELECT o.nombre, o.apellido, o.dpi_cui, o.telefono, o.telefono_respaldo, 
              o.zona_operacion, o.genero, o.fotografia, u.email
       FROM operadores_logisticos o
       INNER JOIN usuarios u ON u.id = o.id
       WHERE o.id = $1`,
      [operadorId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Operador no encontrado." });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al obtener perfil.", error: { details: error.message } });
  }
};

const solicitarCambioPerfil = async (req, res) => {
  const operadorId = req.usuario.id;
  const { nombre, apellido, telefono, telefono_respaldo, zona_operacion, genero } = req.body;

  if (!nombre || !apellido || !telefono || !zona_operacion || !genero) {
    return res.status(400).json({ success: false, message: "Nombre, apellido, telefono, zona de operacion y genero son obligatorios." });
  }

  try {
    const { rows } = await db.pool.query(
      "SELECT nombre, apellido, telefono, telefono_respaldo, zona_operacion, genero FROM operadores_logisticos WHERE id = $1",
      [operadorId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Operador no encontrado." });
    }

    const camposPrevios = rows[0];
    const camposNuevos = { nombre, apellido, telefono, telefono_respaldo: telefono_respaldo || null, zona_operacion, genero };

    await db.pool.query(
      `INSERT INTO solicitudes_cambio_perfil (usuario_id, campos_nuevos, campos_previos)
       VALUES ($1, $2, $3)`,
      [operadorId, JSON.stringify(camposNuevos), JSON.stringify(camposPrevios)]
    );

    res.status(201).json({ success: true, message: "Solicitud de cambio de perfil enviada. Pendiente de aprobacion del administrador." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al solicitar cambio de perfil.", error: { details: error.message } });
  }
};

const verSolicitudesCambio = async (req, res) => {
  const operadorId = req.usuario.id;
  try {
    const { rows } = await db.pool.query(
      `SELECT id, campos_nuevos, campos_previos, estado, motivo_rechazo, fecha_resolucion, created_at
       FROM solicitudes_cambio_perfil
       WHERE usuario_id = $1
       ORDER BY created_at DESC`,
      [operadorId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al obtener solicitudes.", error: { details: error.message } });
  }
};

const reporteGanancias = async (req, res) => {
  const operadorId = req.usuario.id;
  try {
    const { rows } = await db.pool.query(
      `SELECT
          s.id,
          s.nombre_servicio,
          s.zona_cobertura,
          s.estado,
          COUNT(r.id) FILTER (WHERE r.estado NOT IN ('cancelado', 'reembolsado')) AS total_reservaciones,
          SUM(r.precio_total) FILTER (WHERE r.estado NOT IN ('cancelado', 'reembolsado')) AS ingresos_totales,
          SUM(r.ganancia_proveedor) FILTER (WHERE r.estado NOT IN ('cancelado', 'reembolsado')) AS ganancias_operador,
          SUM(r.comision_plataforma) FILTER (WHERE r.estado NOT IN ('cancelado', 'reembolsado')) AS comision_plataforma
       FROM servicios_envio s
       LEFT JOIN reservaciones r ON r.servicio_envio_id = s.id
       WHERE s.operador_id = $1
       GROUP BY s.id, s.nombre_servicio, s.zona_cobertura, s.estado
       ORDER BY ganancias_operador DESC NULLS LAST`,
      [operadorId]
    );

    const totales = rows.reduce((acc, row) => ({
      total_reservaciones: acc.total_reservaciones + parseInt(row.total_reservaciones || 0),
      ingresos_totales: acc.ingresos_totales + parseFloat(row.ingresos_totales || 0),
      ganancias_operador: acc.ganancias_operador + parseFloat(row.ganancias_operador || 0),
      comision_plataforma: acc.comision_plataforma + parseFloat(row.comision_plataforma || 0)
    }), {
      total_reservaciones: 0,
      ingresos_totales: 0,
      ganancias_operador: 0,
      comision_plataforma: 0
    });

    const decoded = rows.map(r => ({
      ...r,
      nombre_servicio: decodeEscapedUnicode(r.nombre_servicio),
      zona_cobertura: decodeEscapedUnicode(r.zona_cobertura)
    }));

    res.json({ success: true, data: decoded, totales });
  } catch (error) {
    console.error("Error en reporte ganancias operador:", error);
    res.status(500).json({ success: false, message: "Error al obtener reporte de ganancias.", error: { details: error.message } });
  }
};

const reporteGananciaPorServicio = async (req, res) => {
  const operadorId = req.usuario.id;
  const servicioId = req.params.servicioId;

  try {
    const { rows } = await db.pool.query(
      `SELECT
          s.id,
          s.nombre_servicio,
          s.descripcion,
          s.zona_cobertura,
          s.horario_disponible,
          s.capacidad_carga_kg,
          s.precio_envio,
          s.estado,
          COALESCE(json_agg(json_build_object(
            'id', r.id,
            'cliente_id', c.id,
            'cliente_nombre', c.nombre,
            'cliente_apellido', c.apellido,
            'cliente_telefono', c.telefono,
            'fecha_inicio', r.fecha_inicio,
            'fecha_fin', r.fecha_fin,
            'direccion_origen', r.direccion_origen,
            'direccion_destino', r.direccion_destino,
            'descripcion_paquete', r.descripcion_paquete,
            'peso_paquete_kg', r.peso_paquete_kg,
            'precio_total', r.precio_total,
            'comision_plataforma', r.comision_plataforma,
            'ganancia_proveedor', r.ganancia_proveedor,
            'estado_reservacion', r.estado,
            'fecha_cancelacion', r.fecha_cancelacion,
            'motivo_cancelacion', r.motivo_cancelacion,
            'created_at', r.created_at
          )) FILTER (WHERE r.id IS NOT NULL), '[]') AS reservaciones
       FROM servicios_envio s
       LEFT JOIN reservaciones r ON r.servicio_envio_id = s.id AND r.estado NOT IN ('cancelado', 'reembolsado')
       LEFT JOIN clientes c ON c.id = r.cliente_id
       WHERE s.operador_id = $1 AND s.id = $2
       GROUP BY s.id`,
      [operadorId, servicioId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado o no pertenece al operador.' });
    }

    const servicio = rows[0];
    servicio.nombre_servicio = decodeEscapedUnicode(servicio.nombre_servicio);
    servicio.descripcion = decodeEscapedUnicode(servicio.descripcion);
    servicio.zona_cobertura = decodeEscapedUnicode(servicio.zona_cobertura);
    servicio.horario_disponible = decodeEscapedUnicode(servicio.horario_disponible);
    servicio.reservaciones = servicio.reservaciones.map((reservacion) => ({
      ...reservacion,
      direccion_origen: decodeEscapedUnicode(reservacion.direccion_origen),
      direccion_destino: decodeEscapedUnicode(reservacion.direccion_destino),
      descripcion_paquete: decodeEscapedUnicode(reservacion.descripcion_paquete),
      motivo_cancelacion: decodeEscapedUnicode(reservacion.motivo_cancelacion)
    }));

    res.json({ success: true, data: servicio });
  } catch (error) {
    console.error('Error en reporte de ganancia por servicio:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el reporte por servicio.', error: { details: error.message } });
  }
};

const reporteHistorialClientes = async (req, res) => {
  const operadorId = req.usuario.id;
  try {
    const { rows } = await db.pool.query(
      `SELECT 
          c.id,
          c.nombre,
          c.apellido,
          c.telefono,
          u.email,
          COUNT(r.id) AS total_reservaciones,
          MAX(r.fecha_inicio) AS ultima_reservacion,
          SUM(r.precio_total) AS total_gastado
       FROM clientes c
       JOIN usuarios u ON c.id = u.id
       JOIN reservaciones r ON r.cliente_id = c.id
       JOIN servicios_envio s ON r.servicio_envio_id = s.id
       WHERE s.operador_id = $1
         AND r.estado NOT IN ('cancelado', 'reembolsado')
       GROUP BY c.id, c.nombre, c.apellido, c.telefono, u.email
       ORDER BY total_reservaciones DESC, ultima_reservacion DESC`,
      [operadorId]
    );

    // Decodificar caracteres especiales usando la misma función de tu equipo
    const decoded = rows.map(r => ({
      ...r,
      nombre: decodeEscapedUnicode(r.nombre),
      apellido: decodeEscapedUnicode(r.apellido)
    }));

    res.json({ success: true, data: decoded });
  } catch (error) {
    console.error("Error en reporte historial de clientes:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener historial de clientes.", 
      error: { details: error.message } 
    });
  }
};


const reporteCalificaciones = async (req, res) => {
  const operadorId = req.usuario.id;
  try {
    const { rows } = await db.pool.query(
      `SELECT 
          c.id AS calificacion_id,
          c.puntuacion,
          c.comentario,
          c.created_at AS fecha,
          s.nombre_servicio,
          cli.nombre AS cliente_nombre,
          cli.apellido AS cliente_apellido
       FROM calificaciones c
       JOIN servicios_envio s ON c.servicio_envio_id = s.id
       JOIN clientes cli ON c.cliente_id = cli.id
       WHERE s.operador_id = $1 AND c.tipo_servicio = 'envio'
       ORDER BY c.created_at DESC`,
      [operadorId]
    );

    const decoded = rows.map(r => ({
      ...r,
      comentario: decodeEscapedUnicode(r.comentario || ""),
      nombre_servicio: decodeEscapedUnicode(r.nombre_servicio || ""),
      cliente_nombre: decodeEscapedUnicode(r.cliente_nombre || ""),
      cliente_apellido: decodeEscapedUnicode(r.cliente_apellido || "")
    }));

    res.json({ success: true, data: decoded });
  } catch (error) {
    console.error("Error en reporte de calificaciones:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener reporte de calificaciones.", 
      error: { details: error.message } 
    });
  }
};

module.exports = {
  obtenerPerfil,
  solicitarCambioPerfil,
  verSolicitudesCambio,
  reporteGanancias,
  reporteGananciaPorServicio,
  reporteHistorialClientes,
  reporteCalificaciones
};

const db = require("../config/db");

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

module.exports = {
  obtenerPerfil,
  solicitarCambioPerfil,
  verSolicitudesCambio
};

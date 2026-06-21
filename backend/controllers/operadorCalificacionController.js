const db = require("../config/db");

const listarCalificaciones = async (req, res) => {
  const operadorId = req.usuario.id;

  try {
    const { rows } = await db.pool.query(
      `SELECT
         c.id,
         c.puntuacion,
         c.comentario,
         c.created_at,
         s.id AS servicio_id,
         s.nombre_servicio,
         cl.nombre AS cliente_nombre,
         cl.apellido AS cliente_apellido,
         rc.id AS respuesta_id,
         rc.respuesta,
         rc.created_at AS respuesta_created_at
       FROM calificaciones c
       INNER JOIN servicios_envio s ON s.id = c.servicio_envio_id
       INNER JOIN clientes cl ON cl.id = c.cliente_id
       LEFT JOIN respuestas_calificacion rc
         ON rc.calificacion_id = c.id AND rc.operador_id = $1
       WHERE s.operador_id = $1
         AND c.tipo_servicio = 'envio'
       ORDER BY c.created_at DESC`,
      [operadorId]
    );

    const total = rows.length;
    const promedio = total > 0
      ? rows.reduce((suma, calificacion) => suma + Number(calificacion.puntuacion), 0) / total
      : 0;
    const pendientesRespuesta = rows.filter((calificacion) => !calificacion.respuesta_id).length;

    res.status(200).json({
      success: true,
      message: "Calificaciones obtenidas exitosamente.",
      data: {
        items: rows.map((calificacion) => ({
          ...calificacion,
          puntuacion: Number(calificacion.puntuacion),
          cliente: `${calificacion.cliente_nombre} ${calificacion.cliente_apellido}`.trim()
        })),
        resumen: {
          promedio: Number(promedio.toFixed(1)),
          total,
          pendientes_respuesta: pendientesRespuesta
        }
      }
    });
  } catch (error) {
    console.error("Error al listar calificaciones del operador:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las calificaciones.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

const responderCalificacion = async (req, res) => {
  const operadorId = req.usuario.id;
  const { id } = req.params;
  const respuesta = typeof req.body.respuesta === "string" ? req.body.respuesta.trim() : "";

  if (!respuesta) {
    return res.status(400).json({
      success: false,
      message: "La respuesta no puede estar vacia.",
      error: { code: "VALIDATION_ERROR" }
    });
  }

  if (respuesta.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "La respuesta no puede superar los 1000 caracteres.",
      error: { code: "VALIDATION_ERROR" }
    });
  }

  try {
    const calificacion = await db.pool.query(
      `SELECT c.id
       FROM calificaciones c
       INNER JOIN servicios_envio s ON s.id = c.servicio_envio_id
       WHERE c.id = $1
         AND s.operador_id = $2
         AND c.tipo_servicio = 'envio'`,
      [id, operadorId]
    );

    if (calificacion.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Calificacion no encontrada o no pertenece a uno de tus servicios.",
        error: { code: "RATING_NOT_FOUND" }
      });
    }

    const resultado = await db.pool.query(
      `INSERT INTO respuestas_calificacion (calificacion_id, operador_id, respuesta)
       VALUES ($1, $2, $3)
       RETURNING id, calificacion_id, respuesta, created_at`,
      [id, operadorId, respuesta]
    );

    res.status(201).json({
      success: true,
      message: "Respuesta publicada exitosamente.",
      data: resultado.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Esta calificacion ya tiene una respuesta.",
        error: { code: "RESPONSE_ALREADY_EXISTS" }
      });
    }

    console.error("Error al responder calificacion:", error);
    res.status(500).json({
      success: false,
      message: "Error al publicar la respuesta.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

module.exports = {
  listarCalificaciones,
  responderCalificacion
};

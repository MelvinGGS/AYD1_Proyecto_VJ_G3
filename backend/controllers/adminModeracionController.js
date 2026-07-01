const db = require("../config/db");
const { enviarCorreo } = require("../utils/mailer");

const listarReportes = async (req, res) => {
  try {
    const query = `
      SELECT r.*,
             u1.email AS reporter_email, u1.rol AS reporter_rol,
             COALESCE(c1.nombre || ' ' || c1.apellido, o1.nombre || ' ' || o1.apellido, e1.nombre_empresa, 'Admin') AS reporter_nombre,
             u2.email AS reported_email, u2.rol AS reported_rol, u2.estado AS reported_estado,
             COALESCE(c2.nombre || ' ' || c2.apellido, o2.nombre || ' ' || o2.apellido, e2.nombre_empresa, 'Admin') AS reported_nombre,
             COALESCE(
               (SELECT json_agg(ev) FROM evidencias_reporte ev WHERE ev.reporte_id = r.id),
               '[]'::json
             ) AS evidencias
      FROM reportes r
      INNER JOIN usuarios u1 ON u1.id = r.reportado_por
      INNER JOIN usuarios u2 ON u2.id = r.reportado_usuario
      LEFT JOIN clientes c1 ON c1.id = u1.id
      LEFT JOIN operadores_logisticos o1 ON o1.id = u1.id
      LEFT JOIN empresas_transporte e1 ON e1.id = u1.id
      LEFT JOIN clientes c2 ON c2.id = u2.id
      LEFT JOIN operadores_logisticos o2 ON o2.id = u2.id
      LEFT JOIN empresas_transporte e2 ON e2.id = u2.id
      ORDER BY r.created_at DESC
    `;
    const { rows } = await db.pool.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al listar reportes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener reportes.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

const resolverReporte = async (req, res) => {
  const { id } = req.params;
  const { estado_nuevo, resolucion, sancion_aplicada, suspendido_hasta } = req.body;

  if (!estado_nuevo || !["en_revision", "aceptado", "rechazado"].includes(estado_nuevo)) {
    return res.status(400).json({
      success: false,
      message: "Estado nuevo invalido. Debe ser 'en_revision', 'aceptado' o 'rechazado'."
    });
  }

  if ((estado_nuevo === "aceptado" || estado_nuevo === "rechazado") && !resolucion) {
    return res.status(400).json({
      success: false,
      message: "La resolucion es obligatoria al aceptar o rechazar un reporte."
    });
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const reporteRes = await client.query("SELECT * FROM reportes WHERE id = $1", [id]);
    if (reporteRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Reporte no encontrado." });
    }
    const reporte = reporteRes.rows[0];

    const usuarioRes = await client.query("SELECT id, email, rol, estado FROM usuarios WHERE id = $1", [reporte.reportado_usuario]);
    if (usuarioRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Usuario reportado no encontrado." });
    }
    const usuarioReportado = usuarioRes.rows[0];

    let sancionAplicadaFinal = null;

    if (estado_nuevo === "aceptado") {
      sancionAplicadaFinal = sancion_aplicada || "ninguna";

      if (sancion_aplicada === "veto") {
        await client.query(
          `UPDATE usuarios 
           SET estado = 'vetado', motivo_veto = $1, fecha_veto = NOW(), vetado_por = $2 
           WHERE id = $3`,
          [resolucion, req.usuario.id, usuarioReportado.id]
        );

        await client.query("DELETE FROM sesiones WHERE usuario_id = $1", [usuarioReportado.id]);

        await client.query(
          `INSERT INTO log_actividad (usuario_id, accion, descripcion, entidad_tipo, entidad_id)
           VALUES ($1, 'veto', $2, 'usuario', $3)`,
          [req.usuario.id, `Usuario ${usuarioReportado.email} vetado por resolucion de reporte ${id}. Motivo: ${resolucion}`, usuarioReportado.id]
        );

        await enviarCorreo(
          usuarioReportado.email,
          "Cuenta vetada de la plataforma - TrackFlow-HUB",
          "Cuenta Vetada Permanentemente",
          `Tu cuenta asociada al correo ${usuarioReportado.email} ha sido vetada permanentemente por violar las normas de la plataforma.<br><br><b>Motivo de la administracion:</b> ${resolucion}<br><br>Si consideras que esto es un error, por favor ponte en contacto con soporte.`,
          ""
        );
      } else if (sancion_aplicada === "suspension_temporal") {
        if (!suspendido_hasta) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            success: false,
            message: "La fecha de suspension hasta es obligatoria para suspension temporal."
          });
        }

        await client.query(
          `UPDATE usuarios 
           SET estado = 'suspendido', suspendido_hasta = $1, motivo_suspension = $2 
           WHERE id = $3`,
          [suspendido_hasta, resolucion, usuarioReportado.id]
        );

        await client.query("DELETE FROM sesiones WHERE usuario_id = $1", [usuarioReportado.id]);

        await client.query(
          `INSERT INTO log_actividad (usuario_id, accion, descripcion, entidad_tipo, entidad_id)
           VALUES ($1, 'suspension', $2, 'usuario', $3)`,
          [req.usuario.id, `Usuario ${usuarioReportado.email} suspendido temporalmente hasta ${suspendido_hasta}. Motivo: ${resolucion}`, usuarioReportado.id]
        );

        const fechaFormateada = new Date(suspendido_hasta).toLocaleDateString();
        await enviarCorreo(
          usuarioReportado.email,
          "Cuenta suspendida temporalmente - TrackFlow-HUB",
          "Cuenta Suspendida Temporalmente",
          `Tu cuenta asociada al correo ${usuarioReportado.email} ha sido suspendida temporalmente.<br><br><b>Fecha de finalizacion de la suspension:</b> ${fechaFormateada}<br><br><b>Motivo de la administracion:</b> ${resolucion}`,
          ""
        );
      } else {
        await client.query(
          `INSERT INTO log_actividad (usuario_id, accion, descripcion, entidad_tipo, entidad_id)
           VALUES ($1, 'resolucion_reporte', $2, 'usuario', $3)`,
          [req.usuario.id, `Reporte ${id} aceptado sin sanciones adicionales para ${usuarioReportado.email}`, usuarioReportado.id]
        );
      }
    } else if (estado_nuevo === "rechazado") {
      await client.query(
        `INSERT INTO log_actividad (usuario_id, accion, descripcion, entidad_tipo, entidad_id)
         VALUES ($1, 'resolucion_reporte', $2, 'usuario', $3)`,
        [req.usuario.id, `Reporte ${id} contra ${usuarioReportado.email} rechazado. Motivo: ${resolucion}`, usuarioReportado.id]
      );
    }

    await client.query(
      `UPDATE reportes 
       SET estado = $1, resolucion = $2, sancion_aplicada = $3, fecha_resolucion = NOW(), revisado_por = $4 
       WHERE id = $5`,
      [estado_nuevo, resolucion || null, sancionAplicadaFinal, req.usuario.id, id]
    );

    await client.query("COMMIT");
    res.json({
      success: true,
      message: `Reporte resuelto correctamente como ${estado_nuevo}.`
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al resolver reporte:", error);
    res.status(500).json({
      success: false,
      message: "Error al resolver reporte.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  } finally {
    client.release();
  }
};

module.exports = {
  listarReportes,
  resolverReporte
};

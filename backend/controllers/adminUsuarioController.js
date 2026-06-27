const db = require("../config/db");
const { enviarCorreo } = require("../utils/mailer");

const listarUsuarios = async (req, res) => {
  const { rol } = req.query;

  try {
    const query = `
      SELECT u.id, u.email, u.rol, u.estado, u.email_verificado, u.created_at,
             u.motivo_veto, u.fecha_veto, u.suspendido_hasta, u.motivo_suspension,
             c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.telefono AS cliente_telefono,
             ol.nombre AS operador_nombre, ol.apellido AS operador_apellido, ol.telefono AS operador_telefono, ol.dpi_cui AS operador_dpi, ol.zona_operacion AS operador_zona, ol.genero AS operador_genero,
             et.nombre_empresa AS empresa_nombre, et.telefono AS empresa_telefono, et.nit AS empresa_nit, et.numero_licencia_operativa AS empresa_licencia, et.logo AS empresa_logo,
             adm.nombre AS admin_nombre, adm.apellido AS admin_apellido, adm.telefono AS admin_telefono
      FROM usuarios u
      LEFT JOIN clientes c ON c.id = u.id
      LEFT JOIN operadores_logisticos ol ON ol.id = u.id
      LEFT JOIN empresas_transporte et ON et.id = u.id
      LEFT JOIN administradores adm ON adm.id = u.id
      WHERE ($1::VARCHAR IS NULL OR u.rol = $1::user_role)
      ORDER BY u.created_at DESC
    `;
    const { rows } = await db.pool.query(query, [rol || null]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

const editarUsuario = async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido,
    telefono,
    dpi_cui,
    zona_operacion,
    nombre_empresa,
    nit,
    numero_licencia_operativa,
    genero
  } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const usuarioRes = await client.query("SELECT id, rol FROM usuarios WHERE id = $1", [id]);
    if (usuarioRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Usuario no encontrado." });
    }
    const user = usuarioRes.rows[0];

    if (user.rol === "cliente") {
      if (!nombre || !apellido || !telefono) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Nombre, apellido y telefono son requeridos para cliente." });
      }
      await client.query(
        `UPDATE clientes SET nombre = $1, apellido = $2, telefono = $3 WHERE id = $4`,
        [nombre, apellido, telefono, id]
      );
    } else if (user.rol === "operador") {
      if (!nombre || !apellido || !dpi_cui || !telefono || !zona_operacion || !genero) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Nombre, apellido, dpi/cui, telefono, zona y genero son requeridos para operador." });
      }
      await client.query(
        `UPDATE operadores_logisticos SET nombre = $1, apellido = $2, dpi_cui = $3, telefono = $4, zona_operacion = $5, genero = $6 WHERE id = $7`,
        [nombre, apellido, dpi_cui, telefono, zona_operacion, genero, id]
      );
    } else if (user.rol === "empresa_transporte") {
      if (!nombre_empresa || !telefono || !nit || !numero_licencia_operativa) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Nombre de empresa, telefono, nit y licencia son requeridos." });
      }
      await client.query(
        `UPDATE empresas_transporte SET nombre_empresa = $1, telefono = $2, nit = $3, numero_licencia_operativa = $4 WHERE id = $5`,
        [nombre_empresa, telefono, nit, numero_licencia_operativa, id]
      );
    } else if (user.rol === "administrador") {
      if (!nombre || !apellido || !telefono) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Nombre, apellido y telefono son requeridos para administrador." });
      }
      await client.query(
        `UPDATE administradores SET nombre = $1, apellido = $2, telefono = $3 WHERE id = $4`,
        [nombre, apellido, telefono, id]
      );
    }

    await client.query(
      `INSERT INTO log_actividad (usuario_id, accion, descripcion, entidad_tipo, entidad_id)
       VALUES ($1, 'edicion_usuario', $2, 'usuario', $3)`,
      [req.usuario.id, `Datos del usuario con ID ${id} modificados por el administrador.`, id]
    );

    await client.query("COMMIT");
    res.json({ success: true, message: "Usuario actualizado correctamente." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al editar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar los datos del usuario.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  } finally {
    client.release();
  }
};

const vetarUsuarioDirecto = async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  if (!motivo) {
    return res.status(400).json({ success: false, message: "El motivo del veto es obligatorio." });
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const usuarioRes = await client.query("SELECT id, email, rol, estado FROM usuarios WHERE id = $1", [id]);
    if (usuarioRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Usuario no encontrado." });
    }
    const user = usuarioRes.rows[0];

    if (user.estado === "vetado") {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "El usuario ya se encuentra vetado." });
    }

    await client.query(
      `UPDATE usuarios 
       SET estado = 'vetado', motivo_veto = $1, fecha_veto = NOW(), vetado_por = $2 
       WHERE id = $3`,
      [motivo, req.usuario.id, id]
    );

    await client.query("DELETE FROM sesiones WHERE usuario_id = $1", [id]);

    await client.query(
      `INSERT INTO log_actividad (usuario_id, accion, descripcion, entidad_tipo, entidad_id)
       VALUES ($1, 'veto', $2, 'usuario', $3)`,
      [req.usuario.id, `Usuario ${user.email} vetado directamente por el administrador. Motivo: ${motivo}`, id]
    );

    await client.query("COMMIT");

    await enviarCorreo(
      user.email,
      "Cuenta vetada de la plataforma - TrackFlow-HUB",
      "Cuenta Vetada Permanentemente",
      `Tu cuenta asociada al correo ${user.email} ha sido vetada permanentemente por decision de la administracion.<br><br><b>Motivo:</b> ${motivo}<br><br>Si consideras que esto es un error, por favor ponte en contacto con soporte.`,
      ""
    );

    res.json({ success: true, message: "Usuario vetado correctamente y notificado por correo." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al vetar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al vetar al usuario.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  } finally {
    client.release();
  }
};

module.exports = {
  listarUsuarios,
  editarUsuario,
  vetarUsuarioDirecto
};

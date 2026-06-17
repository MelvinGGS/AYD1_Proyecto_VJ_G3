const bcrypt = require("bcrypt");
const db = require("../config/db");
const { enviarCorreo } = require("../utils/mailer");

const generarPasswordTemporal = () => {
  const base = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "TfH-";
  for (let i = 0; i < 10; i++) {
    password += base.charAt(Math.floor(Math.random() * base.length));
  }
  return password + "!";
};

const obtenerSolicitud = async (client, solicitudId, rolEsperado) => {
  const { rows } = await client.query(
    `
      SELECT sr.*, u.email, u.rol, u.estado AS estado_usuario
      FROM solicitudes_registro sr
      INNER JOIN usuarios u ON u.id = sr.usuario_id
      WHERE sr.id = $1 AND u.rol = $2
    `,
    [solicitudId, rolEsperado]
  );

  return rows[0];
};

const listarSolicitudesOperadores = async (req, res) => {
  try {
    const { rows } = await db.pool.query(`
      SELECT
        sr.id AS solicitud_id,
        sr.estado AS estado_solicitud,
        sr.motivo_rechazo,
        sr.notas,
        sr.created_at,
        u.id AS usuario_id,
        u.email,
        u.estado AS estado_usuario,
        u.email_verificado,
        o.nombre,
        o.apellido,
        o.dpi_cui,
        o.telefono,
        o.telefono_respaldo,
        o.fotografia,
        o.zona_operacion,
        o.genero
      FROM solicitudes_registro sr
      INNER JOIN usuarios u ON u.id = sr.usuario_id
      INNER JOIN operadores_logisticos o ON o.id = u.id
      WHERE u.rol = 'operador'
      ORDER BY sr.created_at DESC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al listar solicitudes de operadores:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener solicitudes de operadores.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

const listarSolicitudesEmpresas = async (req, res) => {
  try {
    const { rows } = await db.pool.query(`
      SELECT
        sr.id AS solicitud_id,
        sr.estado AS estado_solicitud,
        sr.reunion_fecha,
        sr.reunion_enlace,
        sr.reunion_agendada,
        sr.motivo_rechazo,
        sr.notas,
        sr.created_at,
        u.id AS usuario_id,
        u.email,
        u.estado AS estado_usuario,
        u.email_verificado,
        e.nombre_empresa,
        e.telefono,
        e.telefono_respaldo,
        e.nit,
        e.numero_licencia_operativa,
        e.logo
      FROM solicitudes_registro sr
      INNER JOIN usuarios u ON u.id = sr.usuario_id
      INNER JOIN empresas_transporte e ON e.id = u.id
      WHERE u.rol = 'empresa_transporte'
      ORDER BY sr.created_at DESC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al listar solicitudes de empresas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener solicitudes de empresas.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

const aceptarOperador = async (req, res) => {
  const { id } = req.params;
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const solicitud = await obtenerSolicitud(client, id, "operador");
    if (!solicitud) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Solicitud de operador no encontrada." });
    }

    const passwordTemporal = generarPasswordTemporal();
    const passwordHash = await bcrypt.hash(passwordTemporal, 10);

    await client.query(
      `
        UPDATE usuarios
        SET estado = 'activo',
            password_hash = $1,
            requiere_cambio_password = TRUE
        WHERE id = $2
      `,
      [passwordHash, solicitud.usuario_id]
    );

    await client.query(
      `
        UPDATE solicitudes_registro
        SET estado = 'aceptado',
            revisado_por = $1,
            fecha_resolucion = NOW(),
            motivo_rechazo = NULL
        WHERE id = $2
      `,
      [req.usuario.id, id]
    );

    await client.query("COMMIT");

    await enviarCorreo(
      solicitud.email,
      "Perfil aprobado - TrackFlow-HUB",
      "Perfil de operador aprobado",
      "Tu perfil fue aprobado. Usa esta contrasena temporal para ingresar; luego deberas cambiarla.",
      passwordTemporal
    );

    res.json({
      success: true,
      message: "Operador aceptado correctamente.",
      data: { solicitud_id: id, usuario_id: solicitud.usuario_id, password_temporal: passwordTemporal }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al aceptar operador:", error);
    res.status(500).json({
      success: false,
      message: "Error al aceptar operador.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  } finally {
    client.release();
  }
};

const rechazarSolicitud = (rolEsperado, etiqueta) => async (req, res) => {
  const { id } = req.params;
  const { motivo_rechazo } = req.body;

  if (!motivo_rechazo) {
    return res.status(400).json({
      success: false,
      message: "El motivo de rechazo es obligatorio.",
      error: { code: "VALIDATION_ERROR" }
    });
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const solicitud = await obtenerSolicitud(client, id, rolEsperado);
    if (!solicitud) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: `Solicitud de ${etiqueta} no encontrada.` });
    }

    await client.query(
      "UPDATE usuarios SET estado = 'suspendido' WHERE id = $1",
      [solicitud.usuario_id]
    );

    await client.query(
      `
        UPDATE solicitudes_registro
        SET estado = 'rechazado',
            revisado_por = $1,
            motivo_rechazo = $2,
            fecha_resolucion = NOW()
        WHERE id = $3
      `,
      [req.usuario.id, motivo_rechazo, id]
    );

    await client.query("COMMIT");

    await enviarCorreo(
      solicitud.email,
      "Solicitud rechazada - TrackFlow-HUB",
      "Solicitud de registro rechazada",
      `Tu solicitud de ${etiqueta} fue rechazada. Motivo: ${motivo_rechazo}`,
      ""
    );

    res.json({ success: true, message: `Solicitud de ${etiqueta} rechazada correctamente.` });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`Error al rechazar solicitud de ${etiqueta}:`, error);
    res.status(500).json({
      success: false,
      message: `Error al rechazar solicitud de ${etiqueta}.`,
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  } finally {
    client.release();
  }
};

const agendarReunionEmpresa = async (req, res) => {
  const { id } = req.params;
  const { reunion_fecha, reunion_enlace, notas } = req.body;

  if (!reunion_fecha || !reunion_enlace) {
    return res.status(400).json({
      success: false,
      message: "La fecha y el enlace de reunion son obligatorios.",
      error: { code: "VALIDATION_ERROR" }
    });
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const solicitud = await obtenerSolicitud(client, id, "empresa_transporte");
    if (!solicitud) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Solicitud de empresa no encontrada." });
    }

    await client.query(
      `
        UPDATE solicitudes_registro
        SET estado = 'en_revision',
            reunion_fecha = $1,
            reunion_enlace = $2,
            reunion_agendada = TRUE,
            notas = COALESCE($3, notas)
        WHERE id = $4
      `,
      [reunion_fecha, reunion_enlace, notas || null, id]
    );

    await client.query("COMMIT");

    await enviarCorreo(
      solicitud.email,
      "Reunion agendada - TrackFlow-HUB",
      "Reunion virtual agendada",
      `Tu reunion de aprobacion fue agendada para ${reunion_fecha}. Enlace: <a href="${reunion_enlace}">${reunion_enlace}</a>`,
      ""
    );

    res.json({ success: true, message: "Reunion agendada correctamente." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al agendar reunion:", error);
    res.status(500).json({
      success: false,
      message: "Error al agendar reunion.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  } finally {
    client.release();
  }
};

const aceptarEmpresa = async (req, res) => {
  const { id } = req.params;
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const solicitud = await obtenerSolicitud(client, id, "empresa_transporte");
    if (!solicitud) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Solicitud de empresa no encontrada." });
    }

    const passwordTemporal = generarPasswordTemporal();
    const passwordHash = await bcrypt.hash(passwordTemporal, 10);

    await client.query(
      `
        UPDATE usuarios
        SET estado = 'activo',
            password_hash = $1,
            requiere_cambio_password = TRUE
        WHERE id = $2
      `,
      [passwordHash, solicitud.usuario_id]
    );

    await client.query(
      `
        UPDATE solicitudes_registro
        SET estado = 'aceptado',
            revisado_por = $1,
            fecha_resolucion = NOW(),
            motivo_rechazo = NULL
        WHERE id = $2
      `,
      [req.usuario.id, id]
    );

    await client.query("COMMIT");

    await enviarCorreo(
      solicitud.email,
      "Empresa aprobada - TrackFlow-HUB",
      "Empresa de transporte aprobada",
      "Tu empresa fue aprobada. Usa esta contrasena temporal para ingresar; luego deberas cambiarla.",
      passwordTemporal
    );

    res.json({
      success: true,
      message: "Empresa aceptada correctamente.",
      data: { solicitud_id: id, usuario_id: solicitud.usuario_id, password_temporal: passwordTemporal }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al aceptar empresa:", error);
    res.status(500).json({
      success: false,
      message: "Error al aceptar empresa.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  } finally {
    client.release();
  }
};

const registrarAdministrador = async (req, res) => {
  const { nombre, apellido, telefono, email, password, confirmar_password } = req.body;

  if (!nombre || !apellido || !email || !password || !confirmar_password) {
    return res.status(400).json({
      success: false,
      message: "Faltan campos obligatorios para registrar administrador.",
      error: { code: "VALIDATION_ERROR" }
    });
  }

  if (password !== confirmar_password) {
    return res.status(400).json({
      success: false,
      message: "Las contrasenas no coinciden.",
      error: { code: "PASSWORD_MISMATCH" }
    });
  }

  const emailLower = email.toLowerCase().trim();

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const existeEmail = await client.query("SELECT id FROM usuarios WHERE LOWER(email) = $1", [emailLower]);
    if (existeEmail.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "El correo electronico ya esta registrado.",
        error: { code: "EMAIL_EXISTS" }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const usuarioRes = await client.query(
      `
        INSERT INTO usuarios (email, password_hash, rol, estado, email_verificado)
        VALUES ($1, $2, 'administrador', 'activo', TRUE)
        RETURNING id, email, rol, estado
      `,
      [emailLower, passwordHash]
    );

    const admin = usuarioRes.rows[0];
    await client.query(
      "INSERT INTO administradores (id, nombre, apellido, telefono) VALUES ($1, $2, $3, $4)",
      [admin.id, nombre, apellido, telefono || null]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Administrador registrado correctamente.",
      data: admin
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al registrar administrador:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar administrador.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  } finally {
    client.release();
  }
};

module.exports = {
  listarSolicitudesOperadores,
  listarSolicitudesEmpresas,
  aceptarOperador,
  rechazarOperador: rechazarSolicitud("operador", "operador"),
  agendarReunionEmpresa,
  aceptarEmpresa,
  rechazarEmpresa: rechazarSolicitud("empresa_transporte", "empresa"),
  registrarAdministrador
};

const db = require("../config/db");
const bcrypt = require("bcrypt");
const { enviarCorreo } = require("../utils/mailer");

const generarTokenVerificacion = () => {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 6; i++) {
    token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return token;
};

const registrarEmpresa = async (req, res) => {
  const {
    nombre_empresa,
    telefono,
    telefono_respaldo,
    email,
    nit,
    numero_licencia_operativa
  } = req.body;

  if (!nombre_empresa || !telefono || !email || !nit || !numero_licencia_operativa) {
    return res.status(400).json({
      success: false,
      message: "Faltan campos obligatorios para el registro de empresa.",
      error: { code: "VALIDATION_ERROR" }
    });
  }

  const emailLower = email.toLowerCase().trim();

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const checkEmail = await client.query("SELECT id FROM usuarios WHERE LOWER(email) = $1", [emailLower]);
    if (checkEmail.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "El correo electronico ya esta registrado.",
        error: { code: "EMAIL_EXISTS" }
      });
    }

    const checkNIT = await client.query("SELECT id FROM empresas_transporte WHERE nit = $1", [nit]);
    if (checkNIT.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "El NIT ya esta registrado en el sistema.",
        error: { code: "NIT_EXISTS" }
      });
    }

    const checkLicencia = await client.query("SELECT id FROM empresas_transporte WHERE numero_licencia_operativa = $1", [numero_licencia_operativa]);
    if (checkLicencia.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "La licencia operativa ya esta registrada.",
        error: { code: "LICENCIA_EXISTS" }
      });
    }

    const crypto = require("crypto");
    const passwordAleatorio = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(passwordAleatorio, 10);
    const tokenVerificacion = generarTokenVerificacion();
    const tokenExp = new Date(Date.now() + 60 * 60 * 1000);

    const insertUsuarioQuery = `
      INSERT INTO usuarios (email, password_hash, rol, estado, token_verificacion, token_verificacion_exp)
      VALUES ($1, $2, 'empresa_transporte', 'pendiente_verificacion', $3, $4)
      RETURNING id
    `;
    const usuarioRes = await client.query(insertUsuarioQuery, [
      emailLower,
      passwordHash,
      tokenVerificacion,
      tokenExp
    ]);
    const usuarioId = usuarioRes.rows[0].id;

    const insertEmpresaQuery = `
      INSERT INTO empresas_transporte (id, nombre_empresa, telefono, telefono_respaldo, nit, numero_licencia_operativa)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await client.query(insertEmpresaQuery, [
      usuarioId,
      nombre_empresa,
      telefono,
      telefono_respaldo || null,
      nit,
      numero_licencia_operativa
    ]);

    const insertSolicitudQuery = `
      INSERT INTO solicitudes_registro (usuario_id, estado)
      VALUES ($1, 'pendiente')
    `;
    await client.query(insertSolicitudQuery, [usuarioId]);

    await client.query("COMMIT");

    await enviarCorreo(
      emailLower,
      "Verifica tu cuenta en TrackFlow-HUB",
      "¡Bienvenido a TrackFlow-HUB!",
      "Para completar tu registro de cliente, ingresa el siguiente codigo de 6 digitos:",
      tokenVerificacion
    );

    res.status(201).json({
      success: true,
      message: "Registro exitoso. Verifique su correo electronico para continuar.",
      data: {
        id: usuarioId,
        email: emailLower,
        rol: "empresa_transporte",
        estado: "pendiente_verificacion",
        requiere_verificacion: true,
        token_desarrollo_temp: tokenVerificacion
      }
    });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al procesar el registro.",
      error: { code: "INTERNAL_ERROR", details: err.message }
    });
  } finally {
    client.release();
  }
};

module.exports = {
  registrarEmpresa
};

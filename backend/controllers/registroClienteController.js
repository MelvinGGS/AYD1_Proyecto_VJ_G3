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

const registrarCliente = async (req, res) => {
  const { nombre, apellido, telefono, email, password, confirmar_password, direccion_origen } = req.body;

  if (!nombre || !apellido || !telefono || !email || !password || !confirmar_password) {
    return res.status(400).json({
      success: false,
      message: "Faltan campos obligatorios para el registro de cliente.",
      error: { code: "VALIDATION_ERROR" }
    });
  }

  if (password !== confirmar_password) {
    return res.status(400).json({
      success: false,
      message: "Las contraseñas no coinciden.",
      error: { code: "PASSWORD_MISMATCH" }
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

    const passwordHash = await bcrypt.hash(password, 10);
    const tokenVerificacion = generarTokenVerificacion();
    const tokenExp = new Date(Date.now() + 60 * 60 * 1000);

    const insertUsuarioQuery = `
      INSERT INTO usuarios (email, password_hash, rol, estado, token_verificacion, token_verificacion_exp)
      VALUES ($1, $2, 'cliente', 'pendiente_verificacion', $3, $4)
      RETURNING id
    `;
    const usuarioRes = await client.query(insertUsuarioQuery, [
      emailLower,
      passwordHash,
      tokenVerificacion,
      tokenExp
    ]);
    const usuarioId = usuarioRes.rows[0].id;

    const insertClienteQuery = `
      INSERT INTO clientes (id, nombre, apellido, telefono, direccion_origen)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await client.query(insertClienteQuery, [
      usuarioId,
      nombre,
      apellido,
      telefono,
      direccion_origen || null
    ]);

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
      message: "Registro exitoso. Se ha enviado un codigo de verificacion a su correo electronico.",
      data: {
        id: usuarioId,
        email: emailLower,
        rol: "cliente",
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
  registrarCliente
};

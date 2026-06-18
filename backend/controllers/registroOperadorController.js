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

const registrarOperador = async (req, res) => {
  const {
    nombre,
    apellido,
    dpi_cui,
    telefono,
    telefono_respaldo,
    email,
    zona_operacion,
    genero
  } = req.body;

  const archivoFoto = req.file;

  if (!nombre || !apellido || !dpi_cui || !telefono || !email || !zona_operacion || !genero) {
    return res.status(400).json({
      success: false,
      message: "Faltan campos obligatorios para el registro de operador.",
      error: { code: "VALIDATION_ERROR" }
    });
  }

  const emailLower = email.toLowerCase().trim();

  if (dpi_cui.length !== 13) {
    return res.status(400).json({
      success: false,
      message: "El DPI/CUI debe tener exactamente 13 digitos.",
      error: { code: "INVALID_DPI" }
    });
  }

  if (!archivoFoto) {
    return res.status(400).json({
      success: false,
      message: "Se requiere subir una fotografia para el operador logistico.",
      error: { code: "INVALID_PHOTO" }
    });
  }

  const generosPermitidos = ["masculino", "femenino", "otro", "prefiero_no_decir"];
  if (!generosPermitidos.includes(genero)) {
    return res.status(400).json({
      success: false,
      message: "Genero no es un valor valido.",
      error: { code: "INVALID_GENDER" }
    });
  }

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

    const checkDPI = await client.query("SELECT id FROM operadores_logisticos WHERE dpi_cui = $1", [dpi_cui]);
    if (checkDPI.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "El DPI/CUI ya esta registrado en el sistema.",
        error: { code: "DPI_EXISTS" }
      });
    }

    const fotografiaUrl = `http://localhost:3000/uploads/${archivoFoto.filename}`;

    const crypto = require("crypto");
    const passwordAleatorio = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(passwordAleatorio, 10);
    const tokenVerificacion = generarTokenVerificacion();
    const tokenExp = new Date(Date.now() + 60 * 60 * 1000);

    const insertUsuarioQuery = `
      INSERT INTO usuarios (email, password_hash, rol, estado, token_verificacion, token_verificacion_exp)
      VALUES ($1, $2, 'operador', 'pendiente_verificacion', $3, $4)
      RETURNING id
    `;
    const usuarioRes = await client.query(insertUsuarioQuery, [
      emailLower,
      passwordHash,
      tokenVerificacion,
      tokenExp
    ]);
    const usuarioId = usuarioRes.rows[0].id;

    const insertOperadorQuery = `
      INSERT INTO operadores_logisticos (id, nombre, apellido, dpi_cui, telefono, telefono_respaldo, fotografia, zona_operacion, genero)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    await client.query(insertOperadorQuery, [
      usuarioId,
      nombre,
      apellido,
      dpi_cui,
      telefono,
      telefono_respaldo || null,
      fotografiaUrl,
      zona_operacion,
      genero
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
        rol: "operador",
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
  registrarOperador
};

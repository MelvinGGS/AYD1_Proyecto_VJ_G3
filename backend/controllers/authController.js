const db = require("../config/db");
const bcrypt = require("bcrypt");

// Función auxiliar para generar un token de verificación de 6 caracteres alfanuméricos
const generarTokenVerificacion = () => {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 6; i++) {
    token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return token;
};

// 1. Registro de Cliente
const registrarCliente = async (req, res) => {
  const { nombre, apellido, telefono, email, password, confirmar_password, direccion_origen } = req.body;

  // Validaciones básicas de campos obligatorios
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

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // Verificar si el correo ya está registrado
    const checkEmail = await client.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (checkEmail.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "El correo electrónico ya está registrado.",
        error: { code: "EMAIL_EXISTS" }
      });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    const tokenVerificacion = generarTokenVerificacion();
    const tokenExp = new Date(Date.now() + 60 * 60 * 1000); // Vigencia de 1 hora

    // Insertar en tabla base 'usuarios'
    const insertUsuarioQuery = `
      INSERT INTO usuarios (email, password_hash, rol, estado, token_verificacion, token_verificacion_exp)
      VALUES ($1, $2, 'cliente', 'pendiente_verificacion', $3, $4)
      RETURNING id
    `;
    const usuarioRes = await client.query(insertUsuarioQuery, [
      email,
      passwordHash,
      tokenVerificacion,
      tokenExp
    ]);
    const usuarioId = usuarioRes.rows[0].id;

    // Insertar en tabla 'clientes'
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

    // NOTA: El tokenVerificacion se devuelve en el JSON para pruebas en desarrollo, 
    // en producción se enviaría al correo electrónico.
    res.status(201).json({
      success: true,
      message: "Registro exitoso. Se ha enviado un código de verificación a su correo electrónico.",
      data: {
        id: usuarioId,
        email,
        rol: "cliente",
        estado: "pendiente_verificacion",
        requiere_verificacion: true,
        token_desarrollo_temp: tokenVerificacion // Exclusivo para facilitar pruebas iniciales
      }
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error al registrar cliente:", err);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al procesar el registro.",
      error: { code: "INTERNAL_ERROR", details: err.message }
    });
  } finally {
    client.release();
  }
};

// 2. Registro de Operador Logístico
const registrarOperador = async (req, res) => {
  const {
    nombre,
    apellido,
    dpi_cui,
    telefono,
    telefono_respaldo,
    email,
    password,
    confirmar_password,
    zona_operacion,
    genero
  } = req.body;

  const archivoFoto = req.file;

  // Validaciones de campos
  if (!nombre || !apellido || !dpi_cui || !telefono || !email || !password || !confirmar_password || !zona_operacion || !genero) {
    return res.status(400).json({
      success: false,
      message: "Faltan campos obligatorios para el registro de operador.",
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

  if (dpi_cui.length !== 13) {
    return res.status(400).json({
      success: false,
      message: "El DPI/CUI debe tener exactamente 13 dígitos.",
      error: { code: "INVALID_DPI" }
    });
  }

  if (!archivoFoto) {
    return res.status(400).json({
      success: false,
      message: "Se requiere subir una fotografía para el operador logístico.",
      error: { code: "INVALID_PHOTO" }
    });
  }

  // Validar género permitido
  const generosPermitidos = ["masculino", "femenino", "otro", "prefiero_no_decir"];
  if (!generosPermitidos.includes(genero)) {
    return res.status(400).json({
      success: false,
      message: "Género no es un valor válido.",
      error: { code: "INVALID_GENDER" }
    });
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // Verificar email
    const checkEmail = await client.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (checkEmail.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "El correo electrónico ya está registrado.",
        error: { code: "EMAIL_EXISTS" }
      });
    }

    // Verificar DPI/CUI único
    const checkDPI = await client.query("SELECT id FROM operadores_logisticos WHERE dpi_cui = $1", [dpi_cui]);
    if (checkDPI.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "El DPI/CUI ya está registrado en el sistema.",
        error: { code: "DPI_EXISTS" }
      });
    }

    // URL local de la fotografía
    const fotografiaUrl = `http://localhost:3000/uploads/${archivoFoto.filename}`;

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    const tokenVerificacion = generarTokenVerificacion();
    const tokenExp = new Date(Date.now() + 60 * 60 * 1000);

    // Insertar en 'usuarios'
    const insertUsuarioQuery = `
      INSERT INTO usuarios (email, password_hash, rol, estado, token_verificacion, token_verificacion_exp)
      VALUES ($1, $2, 'operador', 'pendiente_verificacion', $3, $4)
      RETURNING id
    `;
    const usuarioRes = await client.query(insertUsuarioQuery, [
      email,
      passwordHash,
      tokenVerificacion,
      tokenExp
    ]);
    const usuarioId = usuarioRes.rows[0].id;

    // Insertar en 'operadores_logisticos'
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

    // Insertar en 'solicitudes_registro'
    const insertSolicitudQuery = `
      INSERT INTO solicitudes_registro (usuario_id, estado)
      VALUES ($1, 'pendiente')
    `;
    await client.query(insertSolicitudQuery, [usuarioId]);

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Registro exitoso. Verifique su correo electrónico para continuar.",
      data: {
        id: usuarioId,
        email,
        rol: "operador",
        estado: "pendiente_verificacion",
        requiere_verificacion: true,
        token_desarrollo_temp: tokenVerificacion
      }
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error al registrar operador:", err);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al procesar el registro.",
      error: { code: "INTERNAL_ERROR", details: err.message }
    });
  } finally {
    client.release();
  }
};

// 3. Registro de Empresa de Transporte
const registrarEmpresa = async (req, res) => {
  const {
    nombre_empresa,
    telefono,
    telefono_respaldo,
    email,
    password,
    confirmar_password,
    nit,
    numero_licencia_operativa
  } = req.body;

  // Validaciones básicas
  if (!nombre_empresa || !telefono || !email || !password || !confirmar_password || !nit || !numero_licencia_operativa) {
    return res.status(400).json({
      success: false,
      message: "Faltan campos obligatorios para el registro de empresa.",
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

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // Verificar email único
    const checkEmail = await client.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (checkEmail.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "El correo electrónico ya está registrado.",
        error: { code: "EMAIL_EXISTS" }
      });
    }

    // Verificar NIT único
    const checkNIT = await client.query("SELECT id FROM empresas_transporte WHERE nit = $1", [nit]);
    if (checkNIT.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "El NIT ya está registrado en el sistema.",
        error: { code: "NIT_EXISTS" }
      });
    }

    // Verificar Licencia Operativa única
    const checkLicencia = await client.query("SELECT id FROM empresas_transporte WHERE numero_licencia_operativa = $1", [numero_licencia_operativa]);
    if (checkLicencia.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "La licencia operativa ya está registrada.",
        error: { code: "LICENCIA_EXISTS" }
      });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    const tokenVerificacion = generarTokenVerificacion();
    const tokenExp = new Date(Date.now() + 60 * 60 * 1000);

    // Insertar en 'usuarios'
    const insertUsuarioQuery = `
      INSERT INTO usuarios (email, password_hash, rol, estado, token_verificacion, token_verificacion_exp)
      VALUES ($1, $2, 'empresa_transporte', 'pendiente_verificacion', $3, $4)
      RETURNING id
    `;
    const usuarioRes = await client.query(insertUsuarioQuery, [
      email,
      passwordHash,
      tokenVerificacion,
      tokenExp
    ]);
    const usuarioId = usuarioRes.rows[0].id;

    // Insertar en 'empresas_transporte'
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

    // Insertar en 'solicitudes_registro'
    const insertSolicitudQuery = `
      INSERT INTO solicitudes_registro (usuario_id, estado)
      VALUES ($1, 'pendiente')
    `;
    await client.query(insertSolicitudQuery, [usuarioId]);

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Registro exitoso. Verifique su correo electrónico para continuar.",
      data: {
        id: usuarioId,
        email,
        rol: "empresa_transporte",
        estado: "pendiente_verificacion",
        requiere_verificacion: true,
        token_desarrollo_temp: tokenVerificacion
      }
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error al registrar empresa de transporte:", err);
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
  registrarCliente,
  registrarOperador,
  registrarEmpresa
};

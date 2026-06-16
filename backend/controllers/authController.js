const db = require("../config/db");
const bcrypt = require("bcrypt");
const { enviarCorreo } = require("../utils/mailer");

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

    await enviarCorreo(
      email,
      "Verifica tu cuenta en TrackFlow-HUB",
      "¡Bienvenido a TrackFlow-HUB!",
      "Para completar tu registro de cliente, ingresa el siguiente código de 6 dígitos:",
      tokenVerificacion
    );

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

    await enviarCorreo(
      email,
      "Verifica tu cuenta en TrackFlow-HUB",
      "¡Bienvenido a TrackFlow-HUB!",
      "Para completar tu registro de cliente, ingresa el siguiente código de 6 dígitos:",
      tokenVerificacion
    );

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

    await enviarCorreo(
      email,
      "Verifica tu cuenta en TrackFlow-HUB",
      "¡Bienvenido a TrackFlow-HUB!",
      "Para completar tu registro de cliente, ingresa el siguiente código de 6 dígitos:",
      tokenVerificacion
    );

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

// Verificar el token de 6 dígitos para nuevos usuarios
const verificarCorreo = async (req, res) => {
  const { email, token } = req.body;

  try {
    const { rows } = await db.pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (rows.length === 0) return res.status(404).json({ message: "Usuario no encontrado." });

    const usuario = rows[0];
    if (usuario.email_verificado) return res.status(400).json({ message: "El correo ya está verificado." });

    // Validar token y expiración
    if (usuario.token_verificacion !== token) {
      return res.status(400).json({ message: "Código incorrecto." });
    }
    if (new Date() > new Date(usuario.token_verificacion_exp)) {
      return res.status(400).json({ message: "El código ha expirado. Solicita uno nuevo." });
    }

    // Definir el siguiente estado según el rol
    let nuevoEstado = 'activo';
    if (usuario.rol === 'operador' || usuario.rol === 'empresa_transporte') {
      nuevoEstado = 'pendiente_aprobacion'; // Regla estricta del proyecto
    }

    await db.pool.query(
      "UPDATE usuarios SET email_verificado = TRUE, estado = $1, token_verificacion = NULL, token_verificacion_exp = NULL WHERE email = $2",
      [nuevoEstado, email]
    );

    if (usuario.rol === 'operador') {
      await enviarCorreo(
        email,
        "Perfil en revisión - TrackFlow-HUB",
        "¡Correo verificado con éxito!",
        "Tu cuenta ha sido verificada. Actualmente tu perfil de operador logístico se encuentra en proceso de revisión por parte de la administración. Te notificaremos cuando seas aceptado.",
        "" // Pasamos vacío porque no hay token que mostrar
      );
    }

    if (usuario.rol === 'empresa_transporte') {
      await enviarCorreo(
        email,
        "Bienvenido - TrackFlow-HUB",
        "¡Correo verificado con éxito!",
        "Tu cuenta ha sido verificada. Como siguiente paso, debes esperar a la reunión con el equipo de TrackFlow-HUB para validar tu empresa de transporte. Nos pondremos en contacto contigo para agendar la reunión.",
        "" // Pasamos vacío porque no hay token que mostrar
      );
    }

    res.status(200).json({ success: true, message: "Correo verificado exitosamente.", rol: usuario.rol });
  } catch (error) {
    res.status(500).json({ message: "Error al verificar correo." });
  }
};

// Verificar el 2FA del Administrador
const verificar2FAAdmin = async (req, res) => {
  const { email, token_2fa } = req.body;

  try {
    const { rows } = await db.pool.query("SELECT * FROM usuarios WHERE email = $1 AND rol = 'administrador'", [email]);
    if (rows.length === 0) return res.status(404).json({ message: "Administrador no encontrado." });

    const admin = rows[0];

    // Validar token y límite estricto de 2 minutos
    if (admin.token_2fa !== token_2fa) return res.status(400).json({ message: "Código 2FA incorrecto." });
    if (new Date() > new Date(admin.token_2fa_exp)) {
      return res.status(400).json({ message: "El código 2FA ha expirado. Inicia sesión nuevamente." });
    }

    // Limpiar el token de la DB por seguridad
    await db.pool.query("UPDATE usuarios SET token_2fa = NULL, token_2fa_exp = NULL WHERE email = $1", [email]);

    res.status(200).json({
      success: true,
      message: "Autenticación 2FA exitosa",
      token: `token-simulado-${admin.id}`,
      data: {
        id: admin.id,
        email: admin.email,
        rol: admin.rol,
        token: `token-simulado-${admin.id}`
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error al verificar 2FA." });
  }
};

const correoAceptacionOperador = async (email, passwordTemporal) => {
  await enviarCorreo(
    email,
    "¡Felicidades! Has sido aceptado - TrackFlow-HUB",
    "Perfil de Operador Aceptado",
    "Tu perfil ha sido aprobado por la administración. Para tu primer ingreso, utiliza la siguiente contraseña temporal (deberás cambiarla al entrar):",
    passwordTemporal
  );
};

const correoReunionEmpresa = async (email, fecha, hora, enlace) => {
  await enviarCorreo(
    email,
    "Reunión de Aprobación Agendada - TrackFlow-HUB",
    "Agendamiento de Reunión Virtual",
    `La administración ha agendado una reunión virtual para revisar tu propuesta de servicios.<br><br><b>Fecha:</b> ${fecha}<br><b>Hora:</b> ${hora}<br><b>Enlace:</b> <a href="${enlace}">${enlace}</a>`,
    ""
  );
};

const correoCredencialesEmpresa = async (email, passwordEspecial) => {
  await enviarCorreo(
    email,
    "Credenciales de Acceso - TrackFlow-HUB",
    "Empresa Aprobada",
    "Tu empresa ha sido aprobada tras la reunión. Utiliza estas credenciales especiales para ingresar al portal:",
    passwordEspecial
  );
};

// Para el login de usuarios
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "El correo y la contraseña son requeridos.",
      error: { code: "VALIDATION_ERROR" }
    });
  }

  try {
    const { rows } = await db.pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Las credenciales son inválidas.",
        error: { code: "INVALID_CREDENTIALS" }
      });
    }

    const usuario = rows[0];

    // para verificar si está vetado
    if (usuario.estado === "vetado") {
      return res.status(403).json({
        success: false,
        message: "Tu cuenta ha sido vetada. Contacta al administrador.",
        error: { code: "USER_BANNED" }
      });
    }

    // para verificar si el correo está verificado
    if (!usuario.email_verificado) {
      return res.status(403).json({
        success: false,
        message: "Debes verificar tu correo electrónico antes de ingresar.",
        error: { code: "EMAIL_NOT_VERIFIED" }
      });
    }

    // para verificar si operador o empresa están pendientes de aprobación
    if (usuario.estado === "pendiente_aprobacion") {
      return res.status(403).json({
        success: false,
        message: "Tu cuenta está pendiente de aprobación por el administrador.",
        error: { code: "PENDING_APPROVAL" }
      });
    }

    // para verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: "Las credenciales son inválidas.",
        error: { code: "INVALID_CREDENTIALS" }
      });
    }

    // si es administrador, generar token 2FA
    if (usuario.rol === "administrador") {
      const token2FA = generarTokenVerificacion();
      const token2FAExp = new Date(Date.now() + 2 * 60 * 1000); // son 2 minutos

      await db.pool.query(
        "UPDATE usuarios SET token_2fa = $1, token_2fa_exp = $2 WHERE email = $3",
        [token2FA, token2FAExp, email]
      );

      await enviarCorreo(
        email,
        "Código de autenticación 2FA - TrackFlow-HUB",
        "Autenticación de dos pasos",
        "Usa el siguiente código para completar tu inicio de sesión. Esto expira en 2 minutos:",
        token2FA
      );

      return res.status(202).json({
        success: true,
        message: "Se ha enviado un código 2FA a tu correo.",
        requiere_2fa: true
      });
    }

    // para el operador, para verificar si debe cambiar contraseña temporal
    if ((usuario.rol === "operador" || usuario.rol === "empresa_transporte") && usuario.requiere_cambio_password) {
      return res.status(200).json({
        success: true,
        message: "Debes cambiar tu contraseña temporal.",
        requiere_cambio_password: true,
        rol: usuario.rol,
        email: usuario.email
      });
    }

    // esto es para el login exitoso para cliente, operador y empresa
    res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso.",
      token: `token-simulado-${usuario.id}`,
      rol: usuario.rol,
      data: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

module.exports = {
  registrarCliente,
  registrarOperador,
  registrarEmpresa,
  verificarCorreo,
  verificar2FAAdmin,
  correoAceptacionOperador,
  correoReunionEmpresa,
  correoCredencialesEmpresa,
  login
};

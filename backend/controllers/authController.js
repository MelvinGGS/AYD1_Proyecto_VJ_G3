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

// Las funciones de registro se modularizaron y trasladaron a registroController.js


// Verificar el token de 6 dígitos para nuevos usuarios
const verificarCorreo = async (req, res) => {
  const { email, token } = req.body;
  const emailLower = email ? email.toLowerCase().trim() : "";

  try {
    const { rows } = await db.pool.query("SELECT * FROM usuarios WHERE LOWER(email) = $1", [emailLower]);
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
      "UPDATE usuarios SET email_verificado = TRUE, estado = $1, token_verificacion = NULL, token_verificacion_exp = NULL WHERE LOWER(email) = $2",
      [nuevoEstado, emailLower]
    );

    if (usuario.rol === 'operador') {
      await enviarCorreo(
        emailLower,
        "Perfil en revisión - TrackFlow-HUB",
        "¡Correo verificado con éxito!",
        "Tu cuenta ha sido verificada. Actualmente tu perfil de operador logístico se encuentra en proceso de revisión por parte de la administración. Te notificaremos cuando seas aceptado.",
        "" // Pasamos vacío porque no hay token que mostrar
      );
    }

    if (usuario.rol === 'empresa_transporte') {
      await enviarCorreo(
        emailLower,
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
  const emailLower = email ? email.toLowerCase().trim() : "";

  try {
    const { rows } = await db.pool.query("SELECT * FROM usuarios WHERE LOWER(email) = $1 AND rol = 'administrador'", [emailLower]);
    if (rows.length === 0) return res.status(404).json({ message: "Administrador no encontrado." });

    const admin = rows[0];

    // Validar token y límite estricto de 2 minutos
    if (admin.token_2fa !== token_2fa) return res.status(400).json({ message: "Código 2FA incorrecto." });
    if (new Date() > new Date(admin.token_2fa_exp)) {
      return res.status(400).json({ message: "El código 2FA ha expirado. Inicia sesión nuevamente." });
    }

    // Limpiar el token de la DB por seguridad
    await db.pool.query("UPDATE usuarios SET token_2fa = NULL, token_2fa_exp = NULL WHERE LOWER(email) = $1", [emailLower]);

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

  const emailLower = email.toLowerCase().trim();

  try {
    const { rows } = await db.pool.query(
      "SELECT * FROM usuarios WHERE LOWER(email) = $1",
      [emailLower]
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
        "UPDATE usuarios SET token_2fa = $1, token_2fa_exp = $2 WHERE LOWER(email) = $3",
        [token2FA, token2FAExp, emailLower]
      );

      await enviarCorreo(
        emailLower,
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
        email: usuario.email,
        token: `token-simulado-${usuario.id}`
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
    res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

const cambiarPasswordTemporal = async (req, res) => {
  const { password_actual, password_nueva, confirmar_password } = req.body;
  const usuarioId = req.usuario.id;

  if (!password_actual || !password_nueva || !confirmar_password) {
    return res.status(400).json({
      success: false,
      message: "Todos los campos de contraseña son requeridos.",
      error: { code: "VALIDATION_ERROR" }
    });
  }

  if (password_nueva !== confirmar_password) {
    return res.status(400).json({
      success: false,
      message: "La nueva contraseña y su confirmación no coinciden.",
      error: { code: "PASSWORD_MISMATCH" }
    });
  }

  if (password_nueva.length < 8) {
    return res.status(400).json({
      success: false,
      message: "La nueva contraseña debe tener al menos 8 caracteres.",
      error: { code: "PASSWORD_WEAK" }
    });
  }

  const regexPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!regexPassword.test(password_nueva)) {
    return res.status(400).json({
      success: false,
      message: "La nueva contraseña debe contener al menos una mayúscula, un número y un carácter especial.",
      error: { code: "PASSWORD_WEAK" }
    });
  }

  try {
    const { rows } = await db.pool.query("SELECT * FROM usuarios WHERE id = $1", [usuarioId]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado.",
        error: { code: "NOT_FOUND" }
      });
    }

    const usuario = rows[0];

    if (!usuario.requiere_cambio_password) {
      return res.status(400).json({
        success: false,
        message: "Esta cuenta no requiere cambio de contraseña temporal.",
        error: { code: "NOT_REQUIRED" }
      });
    }

    const passwordValida = await bcrypt.compare(password_actual, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: "La contraseña temporal ingresada es incorrecta.",
        error: { code: "INVALID_CURRENT_PASSWORD" }
      });
    }

    const passwordHash = await bcrypt.hash(password_nueva, 10);
    await db.pool.query(
      "UPDATE usuarios SET password_hash = $1, requiere_cambio_password = FALSE WHERE id = $2",
      [passwordHash, usuarioId]
    );

    res.status(200).json({
      success: true,
      message: "Contraseña actualizada exitosamente.",
      data: { requiere_cambio_password: false }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

module.exports = {
  verificarCorreo,
  verificar2FAAdmin,
  correoAceptacionOperador,
  correoReunionEmpresa,
  correoCredencialesEmpresa,
  login,
  cambiarPasswordTemporal
};

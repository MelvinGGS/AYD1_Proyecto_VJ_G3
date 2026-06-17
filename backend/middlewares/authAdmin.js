const db = require("../config/db");

const obtenerIdDesdeToken = (authorization) => {
  if (!authorization) return null;

  const [tipo, token] = authorization.split(" ");
  if (tipo !== "Bearer" || !token?.startsWith("token-simulado-")) {
    return null;
  }

  return token.replace("token-simulado-", "");
};

const verificarAdmin = async (req, res, next) => {
  const usuarioId = obtenerIdDesdeToken(req.headers.authorization);

  if (!usuarioId) {
    return res.status(401).json({
      success: false,
      message: "Token de autenticacion requerido.",
      error: { code: "AUTH_REQUIRED" }
    });
  }

  try {
    const { rows } = await db.pool.query(
      "SELECT id, email, rol, estado FROM usuarios WHERE id = $1",
      [usuarioId]
    );

    if (rows.length === 0 || rows[0].rol !== "administrador" || rows[0].estado !== "activo") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos de administrador.",
        error: { code: "ADMIN_REQUIRED" }
      });
    }

    req.usuario = rows[0];
    next();
  } catch (error) {
    console.error("Error al verificar administrador:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al validar permisos.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

module.exports = verificarAdmin;

const db = require("../config/db");

const obtenerIdDesdeToken = (authorization) => {
  if (!authorization) return null;

  const [tipo, token] = authorization.split(" ");
  if (tipo !== "Bearer" || !token?.startsWith("token-simulado-")) {
    return null;
  }

  return token.replace("token-simulado-", "");
};

const verificarAutenticado = async (req, res, next) => {
  const usuarioId = obtenerIdDesdeToken(req.headers.authorization);

  if (!usuarioId) {
    return res.status(401).json({
      success: false,
      message: "Token de autenticacion requerido.",
      error: { code: "NO_TOKEN" }
    });
  }

  try {
    const { rows } = await db.pool.query(
      "SELECT id, email, rol, estado FROM usuarios WHERE id = $1",
      [usuarioId]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Token invalido o usuario no encontrado.",
        error: { code: "TOKEN_INVALID" }
      });
    }

    req.usuario = rows[0];
    next();
  } catch (error) {
    console.error("Error al verificar autenticacion:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al validar autenticacion.",
      error: { code: "INTERNAL_ERROR" }
    });
  }
};

module.exports = verificarAutenticado;

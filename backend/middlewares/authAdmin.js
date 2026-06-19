const jwt = require("jsonwebtoken");
const db = require("../config/db");

const verificarAdmin = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      success: false,
      message: "Token de autenticación requerido.",
      error: { code: "AUTH_REQUIRED" }
    });
  }

  const [tipo, token] = authorization.split(" ");
  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Formato de token inválido.",
      error: { code: "TOKEN_INVALID" }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario existe, es admin y está activo
    const { rows } = await db.pool.query(
      "SELECT id, email, rol, estado FROM usuarios WHERE id = $1",
      [decoded.id]
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
    return res.status(403).json({
      success: false,
      message: "Token inválido o expirado.",
      error: { code: "TOKEN_INVALID" }
    });
  }
};

module.exports = verificarAdmin;
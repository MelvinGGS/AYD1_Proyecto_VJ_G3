const jwt = require("jsonwebtoken");
const db = require("../config/db");

const verificarAutenticado = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      success: false,
      message: "Token de autenticación requerido.",
      error: { code: "NO_TOKEN" }
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

    // Verificar que el usuario aún existe y no está vetado
    const { rows } = await db.pool.query(
      "SELECT id, email, rol, estado FROM usuarios WHERE id = $1",
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Token inválido o usuario no encontrado.",
        error: { code: "TOKEN_INVALID" }
      });
    }

    if (rows[0].estado === "vetado") {
      return res.status(403).json({
        success: false,
        message: "Tu cuenta ha sido vetada. Contacta al administrador.",
        error: { code: "USER_BANNED" }
      });
    }

    req.usuario = rows[0];
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado.",
      error: { code: "TOKEN_INVALID" }
    });
  }
};

module.exports = verificarAutenticado;
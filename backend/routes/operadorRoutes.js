const express = require("express");
const router = express.Router();
const operadorServicioController = require("../controllers/operadorServicioController");
const operadorController = require("../controllers/operadorController");
const authMiddleware = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Autenticar que sea un opeador activo
const verificarOperador = (req, res, next) => {
  if (req.usuario && req.usuario.rol === "operador" && req.usuario.estado === "activo") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Acceso denegado. Se requieren permisos de operador activo.",
      error: { code: "FORBIDDEN" }
    });
  }
};

// Verificación de rol a todas las rutas de operador
router.use(authMiddleware);
router.use(verificarOperador);

// Rutas para crear y listar servicios
router.post("/servicios", upload.array("fotos", 10), operadorServicioController.crearServicio);
router.get("/servicios", operadorServicioController.listarMisServicios);
router.put("/servicios/:id", operadorServicioController.actualizarServicio);
router.delete("/servicios/:id", operadorServicioController.eliminarServicio);
router.patch("/servicios/:id/estado", operadorServicioController.cambiarEstadoServicio);

// Rutas de gestion de perfil
router.get("/perfil", operadorController.obtenerPerfil);
router.post("/perfil/solicitar-cambio", operadorController.solicitarCambioPerfil);
router.get("/perfil/solicitudes", operadorController.verSolicitudesCambio);
router.get("/reportes/ganancias", operadorController.reporteGanancias);
router.get("/reportes/servicio/:servicioId", operadorController.reporteGananciaPorServicio);

module.exports = router;

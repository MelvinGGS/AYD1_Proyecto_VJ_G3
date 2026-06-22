const express = require("express");
const router = express.Router();
const operadorServicioController = require("../controllers/operadorServicioController");
const operadorController = require("../controllers/operadorController");
const operadorCalificacionController = require("../controllers/operadorCalificacionController");
const operadorCalendarioController = require("../controllers/operadorCalendarioController");
const operadorCuponController = require("../controllers/operadorCuponController");
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

// Rutas de calificaciones y respuestas
router.get("/calificaciones", operadorCalificacionController.listarCalificaciones);
router.post("/calificaciones/:id/respuesta", operadorCalificacionController.responderCalificacion);

// Calendario mensual de envios programados
router.get("/calendario", operadorCalendarioController.obtenerCalendario);

// Gestion de cupones para clientes del operador
router.get("/cupones/clientes", operadorCuponController.listarClientesElegibles);
router.get("/cupones", operadorCuponController.listarCupones);
router.post("/cupones", operadorCuponController.crearCupon);
router.patch("/cupones/:id/desactivar", operadorCuponController.desactivarCupon);

module.exports = router;

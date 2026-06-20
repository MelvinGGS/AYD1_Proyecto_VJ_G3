const express = require("express");
const router = express.Router();
const empresaController = require("../controllers/empresaController");
const verificarAutenticado = require("../middlewares/auth");

router.use(verificarAutenticado);

// para perfil
router.get("/perfil", empresaController.obtenerPerfil);
router.post("/perfil/solicitar-cambio", empresaController.solicitarCambioPerfil);
router.get("/perfil/solicitudes", empresaController.verSolicitudesCambio);

// para cupones
router.get("/cupones", empresaController.listarCupones);
router.post("/cupones", empresaController.crearCupon);
router.patch("/cupones/:id/desactivar", empresaController.desactivarCupon);
router.post("/cupones/:id/enviar", empresaController.enviarCuponPorCorreo);

// reporte recibidos
router.get("/reportes", empresaController.verReportesRecibidos);
// reporte de la empresa
router.get("/reportes/ganancias", empresaController.reporteGanancias);
router.get("/reportes/historial-servicios", empresaController.historialServicios);
router.get("/reportes/calificaciones", empresaController.reporteCalificaciones);
router.get("/reportes/estado-rutas", empresaController.reporteEstadoRutas);

module.exports = router;
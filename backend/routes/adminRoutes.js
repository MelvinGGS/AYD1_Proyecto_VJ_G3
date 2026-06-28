const express = require("express");
const adminController = require("../controllers/adminController");
const adminModeracionController = require("../controllers/adminModeracionController");
const adminVisualizacionController = require("../controllers/adminVisualizacionController");
const adminUsuarioController = require("../controllers/adminUsuarioController");
const adminEstadisticasController = require("../controllers/adminEstadisticasController");
const verificarAdmin = require("../middlewares/authAdmin");

const router = express.Router();

router.use(verificarAdmin);

// Rutas originales
router.get("/solicitudes/operadores", adminController.listarSolicitudesOperadores);
router.patch("/solicitudes/operadores/:id/aceptar", adminController.aceptarOperador);
router.patch("/solicitudes/operadores/:id/rechazar", adminController.rechazarOperador);

router.get("/solicitudes/empresas", adminController.listarSolicitudesEmpresas);
router.patch("/solicitudes/empresas/:id/agendar-reunion", adminController.agendarReunionEmpresa);
router.patch("/solicitudes/empresas/:id/aceptar", adminController.aceptarEmpresa);
router.patch("/solicitudes/empresas/:id/rechazar", adminController.rechazarEmpresa);

router.post("/administradores", adminController.registrarAdministrador);

router.get("/solicitudes/cambio-perfil", adminController.listarSolicitudesCambioPerfil);
router.patch("/solicitudes/cambio-perfil/:id/resolver", adminController.resolverCambioPerfil);

// Nuevas rutas de Moderación de Reportes
router.get("/reportes", adminModeracionController.listarReportes);
router.patch("/reportes/:id/resolver", adminModeracionController.resolverReporte);

// Nuevas rutas de Visualización Operacional
router.get("/visualizacion/servicios", adminVisualizacionController.visualizarServicios);
router.get("/visualizacion/envios", adminVisualizacionController.visualizarEnvios);

// Nuevas rutas de Gestión de Usuarios
router.get("/usuarios", adminUsuarioController.listarUsuarios);
router.put("/usuarios/:id", adminUsuarioController.editarUsuario);
router.patch("/usuarios/:id/vetar", adminUsuarioController.vetarUsuarioDirecto);

// Nuevas rutas de Estadísticas
router.get("/estadisticas", adminEstadisticasController.obtenerEstadisticasYLogs);
router.get("/logs", adminEstadisticasController.listarLogs);

module.exports = router;

const express = require("express");
const adminController = require("../controllers/adminController");
const verificarAdmin = require("../middlewares/authAdmin");

const router = express.Router();

router.use(verificarAdmin);

router.get("/solicitudes/operadores", adminController.listarSolicitudesOperadores);
router.patch("/solicitudes/operadores/:id/aceptar", adminController.aceptarOperador);
router.patch("/solicitudes/operadores/:id/rechazar", adminController.rechazarOperador);

router.get("/solicitudes/empresas", adminController.listarSolicitudesEmpresas);
router.patch("/solicitudes/empresas/:id/agendar-reunion", adminController.agendarReunionEmpresa);
router.patch("/solicitudes/empresas/:id/aceptar", adminController.aceptarEmpresa);
router.patch("/solicitudes/empresas/:id/rechazar", adminController.rechazarEmpresa);

router.post("/administradores", adminController.registrarAdministrador);

//para los cupones
router.get("/solicitudes/cambio-perfil", adminController.listarSolicitudesCambioPerfil);
router.patch("/solicitudes/cambio-perfil/:id/resolver", adminController.resolverCambioPerfil);

module.exports = router;

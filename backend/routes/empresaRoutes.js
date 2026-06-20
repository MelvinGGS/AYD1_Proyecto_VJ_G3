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

module.exports = router;
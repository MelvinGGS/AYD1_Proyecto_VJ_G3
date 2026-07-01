const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/clienteController");
const verificarAutenticado = require("../middlewares/auth");

router.use(verificarAutenticado);

router.get("/perfil", clienteController.obtenerPerfil);
router.put("/perfil", clienteController.editarPerfil);
router.get("/cupones", clienteController.listarCupones);
router.get("/cupones/validar/:codigo", clienteController.validarCupon);
router.get("/transportes", clienteController.obtenerTransportes);
router.get("/servicios-envio", clienteController.obtenerServiciosEnvio);

module.exports = router;
const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/clienteController");
const verificarAutenticado = require("../middlewares/auth");

router.use(verificarAutenticado);

router.get("/perfil", clienteController.obtenerPerfil);
router.put("/perfil", clienteController.editarPerfil);

module.exports = router;
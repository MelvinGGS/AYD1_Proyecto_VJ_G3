const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const upload = require("../middlewares/upload");

// Rutas de registro según el contrato de API REST
router.post("/registro/cliente", authController.registrarCliente);
router.post("/registro/operador", upload.single("fotografia"), authController.registrarOperador);
router.post("/registro/empresa", authController.registrarEmpresa);

module.exports = router;

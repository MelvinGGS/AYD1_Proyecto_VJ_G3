const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const registroClienteController = require("../controllers/registroClienteController");
const registroOperadorController = require("../controllers/registroOperadorController");
const registroEmpresaController = require("../controllers/registroEmpresaController");
const upload = require("../middlewares/upload");
const authMiddleware = require("../middlewares/auth");

// Rutas de registro según el contrato de API REST
router.post("/registro/cliente", registroClienteController.registrarCliente);
router.post("/registro/operador", upload.single("fotografia"), registroOperadorController.registrarOperador);
router.post("/registro/empresa", registroEmpresaController.registrarEmpresa);

// la ruta del login
router.post("/login", authController.login);

// Rutas de verificación
router.post("/verificar-correo", authController.verificarCorreo);
router.post("/login/admin/verificar", authController.verificar2FAAdmin);

// Cambiar contraseña temporal 
router.put("/cambiar-password-temporal", authMiddleware, authController.cambiarPasswordTemporal);

module.exports = router;

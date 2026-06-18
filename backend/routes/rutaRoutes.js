const express = require("express");
const router = express.Router();
const rutaController = require("../controllers/rutaController");

// Ruta para registrar manualmente
router.post("/manual", rutaController.registrarRutaManual);

module.exports = router;
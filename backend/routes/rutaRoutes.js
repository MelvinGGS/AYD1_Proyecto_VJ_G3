const express = require("express");
const router = express.Router();
const rutaController = require("../controllers/rutaController");

// Ruta para registrar manualmente
router.post("/manual", rutaController.registrarRutaManual);

// Ruta para editar una ruta existente
router.put("/:id", rutaController.editarRuta);

// Ruta para cambiar el estado de una ruta (suspender o cancelar)
router.patch("/:id/estado", rutaController.cambiarEstadoRuta);

module.exports = router;
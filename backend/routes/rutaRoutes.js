const express = require("express");
const router = express.Router();
const rutaController = require("../controllers/rutaController");
const uploadCsv = require("../middlewares/uploadCsv");

// Ruta para registrar manualmente
router.post("/manual", rutaController.registrarRutaManual);

// Ruta para editar una ruta existente
router.put("/:id", rutaController.editarRuta);

// Ruta para cambiar el estado de una ruta (suspender o cancelar)
router.patch("/:id/estado", rutaController.cambiarEstadoRuta);

// Ruta para cargar rutas masivas desde un archivo CSV
router.post("/csv", uploadCsv.single("archivo_csv"), rutaController.cargarRutasCSV);

// Ruta para obtener las rutas de una empresa
router.get("/empresa/:empresa_id", rutaController.obtenerRutasEmpresa);

module.exports = router;
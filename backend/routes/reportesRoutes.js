// routes/reportesRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const reportesController = require("../controllers/reportesController");
const verificarAutenticado = require("../middlewares/auth");

// 1. Configuración de Multer para la carpeta .upload
const dirUpload = path.join(__dirname, '../.upload');
if (!fs.existsSync(dirUpload)){
    fs.mkdirSync(dirUpload);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, dirUpload);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'evidencia-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 2. Middleware de autenticación para proteger todas las rutas
router.use(verificarAutenticado);

// 3. Rutas de uso para el Cliente
router.post("/", upload.single('evidencia'), reportesController.crearReporte);
router.get("/cliente/:cliente_id", reportesController.obtenerHistorialReportesCliente);
router.patch('/:id/estado', reportesController.actualizarEstadoReporte); 

// 4. Rutas de uso para la Empresa de Transporte (y Operadores)
router.get("/empresa/:empresa_id", reportesController.obtenerReportesContraEmpresa);

router.put('/:id/responder', reportesController.responderReporte);

module.exports = router;
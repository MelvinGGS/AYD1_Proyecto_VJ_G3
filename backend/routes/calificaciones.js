const express = require('express');
const router = express.Router();
const { crearCalificacion } = require('../controllers/calificacionesController');

// Ruta POST: /api/calificaciones
router.post('/', crearCalificacion);

module.exports = router;
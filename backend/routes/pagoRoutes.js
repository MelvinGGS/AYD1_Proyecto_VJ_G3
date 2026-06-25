const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const verificarAutenticado = require('../middlewares/auth');

router.use(verificarAutenticado);

router.get('/metodos', pagoController.obtenerMetodosPago);
router.post('/metodo', pagoController.agregarMetodoPago);
router.post('/checkout', pagoController.procesarPago);

module.exports = router;
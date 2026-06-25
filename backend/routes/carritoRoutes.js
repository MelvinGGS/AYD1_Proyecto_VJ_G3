const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carritoController');
const verificarAutenticado = require('../middlewares/auth'); 

// Todas las rutas del carrito requieren que el cliente esté logueado
router.use(verificarAutenticado);

router.get('/', carritoController.obtenerCarrito);
router.post('/', carritoController.agregarAlCarrito);
router.delete('/:id', carritoController.eliminarDelCarrito);
router.delete('/', carritoController.vaciarCarrito);

module.exports = router;
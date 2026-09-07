// ============================================================
// Rutas de Préstamos
// ============================================================
// Define los endpoints de la API para el recurso Préstamos.
// Cada ruta delega la lógica al controlador correspondiente.
// ============================================================

const express = require('express');
const router = express.Router();
const prestamosController = require('../controllers/prestamosController');

// GET /api/prestamos - Consultar todos los préstamos
router.get('/', prestamosController.obtenerTodos);

// POST /api/prestamos - Registrar un nuevo préstamo
router.post('/', prestamosController.crear);

// PUT /api/prestamos/:id/devolver - Registrar devolución de un préstamo
router.put('/:id/devolver', prestamosController.devolver);

// DELETE /api/prestamos/devueltos - Eliminar todos los préstamos devueltos
// IMPORTANTE: Esta ruta va ANTES de /:id para que Express no interprete "devueltos" como un ID
router.delete('/devueltos', prestamosController.eliminarTodosDevueltos);

// DELETE /api/prestamos/:id - Eliminar un préstamo devuelto individual
router.delete('/:id', prestamosController.eliminar);

module.exports = router;

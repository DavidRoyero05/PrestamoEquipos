// ============================================================
// Rutas de Equipos
// ============================================================
// Define los endpoints de la API para el recurso Equipos.
// Cada ruta delega la lógica al controlador correspondiente.
// ============================================================

const express = require('express');
const router = express.Router();
const equiposController = require('../controllers/equiposController');

// GET /api/equipos - Consultar todos los equipos
router.get('/', equiposController.obtenerTodos);

// GET /api/equipos/:id - Consultar un equipo específico
router.get('/:id', equiposController.obtenerPorId);

// POST /api/equipos - Registrar un equipo nuevo
router.post('/', equiposController.crear);

// PUT /api/equipos/:id - Actualizar un equipo
router.put('/:id', equiposController.actualizar);

// DELETE /api/equipos/:id - Eliminar un equipo
router.delete('/:id', equiposController.eliminar);

module.exports = router;

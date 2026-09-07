// ============================================================
// Controlador de Préstamos
// ============================================================
// Valida reglas de negocio, llama a la capa data y retorna JSON.
// Las reglas de negocio se validan aquí antes de llegar a la BD.
// ============================================================

const prestamosData = require('../data/prestamosData');
const equiposData = require('../data/equiposData');

/**
 * GET /api/prestamos
 * Consultar todos los préstamos.
 */
async function obtenerTodos(req, res) {
    try {
        const prestamos = await prestamosData.obtenerTodos();
        res.status(200).json({ ok: true, datos: prestamos });
    } catch (error) {
        console.error('Error al obtener préstamos:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
}

/**
 * POST /api/prestamos
 * Registrar un nuevo préstamo.
 *
 * Reglas de negocio validadas:
 * 1. El equipo debe existir.
 * 2. El equipo debe estar DISPONIBLE.
 * 3. Un equipo en MANTENIMIENTO no puede prestarse.
 * 4. Un equipo PRESTADO no puede prestarse nuevamente.
 * 5. Los campos obligatorios no pueden estar vacíos.
 * 6. fecha_devolucion_prevista no puede ser anterior a fecha_prestamo.
 */
async function crear(req, res) {
    try {
        const { equipo_id, responsable, identificacion, fecha_prestamo, fecha_devolucion_prevista } = req.body;

        // --- Validar campos obligatorios ---
        if (!equipo_id) {
            return res.status(400).json({ ok: false, mensaje: 'El equipo es obligatorio.' });
        }
        if (!responsable || !responsable.trim()) {
            return res.status(400).json({ ok: false, mensaje: 'El responsable es obligatorio.' });
        }
        if (!identificacion || !identificacion.trim()) {
            return res.status(400).json({ ok: false, mensaje: 'La identificación es obligatoria.' });
        }
        if (!fecha_prestamo) {
            return res.status(400).json({ ok: false, mensaje: 'La fecha de préstamo es obligatoria.' });
        }
        if (!fecha_devolucion_prevista) {
            return res.status(400).json({ ok: false, mensaje: 'La fecha de devolución prevista es obligatoria.' });
        }

        // --- Validar fechas ---
        const fechaPrestamo = new Date(fecha_prestamo);
        const fechaDevolucion = new Date(fecha_devolucion_prevista);

        if (isNaN(fechaPrestamo.getTime())) {
            return res.status(400).json({ ok: false, mensaje: 'La fecha de préstamo no es válida.' });
        }
        if (isNaN(fechaDevolucion.getTime())) {
            return res.status(400).json({ ok: false, mensaje: 'La fecha de devolución prevista no es válida.' });
        }
        if (fechaDevolucion < fechaPrestamo) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La fecha de devolución prevista no puede ser anterior a la fecha de préstamo.'
            });
        }

        // --- Validar equipo ---
        const equipoId = parseInt(equipo_id);
        if (isNaN(equipoId)) {
            return res.status(400).json({ ok: false, mensaje: 'El ID del equipo debe ser un número válido.' });
        }

        const equipo = await equiposData.obtenerPorId(equipoId);

        if (!equipo) {
            return res.status(404).json({ ok: false, mensaje: 'El equipo seleccionado no existe.' });
        }

        // Regla: Solo equipos DISPONIBLES pueden prestarse
        if (equipo.ESTADO === 'MANTENIMIENTO') {
            return res.status(400).json({
                ok: false,
                mensaje: 'El equipo se encuentra en mantenimiento y no puede ser prestado.'
            });
        }

        if (equipo.ESTADO === 'PRESTADO') {
            return res.status(400).json({
                ok: false,
                mensaje: 'El equipo ya se encuentra prestado y no puede prestarse nuevamente.'
            });
        }

        if (equipo.ESTADO !== 'DISPONIBLE') {
            return res.status(400).json({
                ok: false,
                mensaje: `El equipo no está disponible. Estado actual: ${equipo.ESTADO}.`
            });
        }

        // --- Crear el préstamo (con transacción) ---
        const prestamo = await prestamosData.crear({
            equipo_id: equipoId,
            responsable: responsable.trim(),
            identificacion: identificacion.trim(),
            fecha_prestamo,
            fecha_devolucion_prevista
        });

        res.status(201).json({
            ok: true,
            mensaje: 'Préstamo registrado exitosamente.',
            datos: prestamo
        });

    } catch (error) {
        console.error('Error al crear préstamo:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
}

/**
 * PUT /api/prestamos/:id/devolver
 * Registrar la devolución de un préstamo.
 *
 * Reglas de negocio:
 * - El préstamo debe existir.
 * - El préstamo debe estar ACTIVO.
 * - No puede devolverse un préstamo ya DEVUELTO.
 */
async function devolver(req, res) {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ ok: false, mensaje: 'El ID debe ser un número válido.' });
        }

        // Verificar que el préstamo existe
        const prestamoExistente = await prestamosData.obtenerPorId(id);
        if (!prestamoExistente) {
            return res.status(404).json({ ok: false, mensaje: 'Préstamo no encontrado.' });
        }

        // Verificar que no esté ya devuelto
        if (prestamoExistente.ESTADO === 'DEVUELTO') {
            return res.status(400).json({
                ok: false,
                mensaje: 'Este préstamo ya fue devuelto anteriormente.'
            });
        }

        // Registrar la devolución (con transacción)
        const prestamo = await prestamosData.devolver(id);

        res.status(200).json({
            ok: true,
            mensaje: 'Devolución registrada exitosamente.',
            datos: prestamo
        });

    } catch (error) {
        // Manejar error de regla de negocio desde la capa data
        if (error.tipo === 'NEGOCIO') {
            return res.status(400).json({ ok: false, mensaje: error.message });
        }
        console.error('Error al registrar devolución:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
}

/**
 * DELETE /api/prestamos/:id
 * Eliminar un préstamo del historial.
 *
 * Reglas:
 * - El préstamo debe existir.
 * - Solo se pueden eliminar préstamos DEVUELTOS.
 * - Un préstamo ACTIVO no puede eliminarse.
 */
async function eliminar(req, res) {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ ok: false, mensaje: 'El ID debe ser un número válido.' });
        }

        // Verificar que el préstamo existe
        const prestamoExistente = await prestamosData.obtenerPorId(id);
        if (!prestamoExistente) {
            return res.status(404).json({ ok: false, mensaje: 'Préstamo no encontrado.' });
        }

        // Solo permitir eliminar préstamos DEVUELTOS
        if (prestamoExistente.ESTADO === 'ACTIVO') {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se puede eliminar un préstamo activo.'
            });
        }

        const eliminado = await prestamosData.eliminarDevuelto(id);

        if (eliminado) {
            res.status(200).json({ ok: true, mensaje: 'Registro de préstamo eliminado del historial.' });
        } else {
            res.status(500).json({ ok: false, mensaje: 'No se pudo eliminar el registro.' });
        }
    } catch (error) {
        console.error('Error al eliminar préstamo:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
}

/**
 * DELETE /api/prestamos/devueltos
 * Eliminar todos los préstamos devueltos del historial.
 * Nunca elimina préstamos ACTIVOS.
 */
async function eliminarTodosDevueltos(req, res) {
    try {
        const eliminados = await prestamosData.eliminarTodosDevueltos();

        res.status(200).json({
            ok: true,
            mensaje: 'Historial de préstamos devueltos eliminado.',
            eliminados
        });
    } catch (error) {
        console.error('Error al eliminar préstamos devueltos:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
}

module.exports = {
    obtenerTodos,
    crear,
    devolver,
    eliminar,
    eliminarTodosDevueltos
};

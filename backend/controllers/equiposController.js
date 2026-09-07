// ============================================================
// Controlador de Equipos
// ============================================================
// Recibe las peticiones HTTP desde las rutas, valida los datos,
// llama a la capa data y retorna respuestas JSON con códigos HTTP.
// ============================================================

const equiposData = require('../data/equiposData');

// Estados válidos para un equipo
const ESTADOS_VALIDOS = ['DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO'];

/**
 * GET /api/equipos
 * Consultar todos los equipos.
 */
async function obtenerTodos(req, res) {
    try {
        const equipos = await equiposData.obtenerTodos();
        res.status(200).json({ ok: true, datos: equipos });
    } catch (error) {
        console.error('Error al obtener equipos:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
}

/**
 * GET /api/equipos/:id
 * Consultar un equipo específico.
 */
async function obtenerPorId(req, res) {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ ok: false, mensaje: 'El ID debe ser un número válido.' });
        }

        const equipo = await equiposData.obtenerPorId(id);

        if (!equipo) {
            return res.status(404).json({ ok: false, mensaje: 'Equipo no encontrado.' });
        }

        res.status(200).json({ ok: true, datos: equipo });
    } catch (error) {
        console.error('Error al obtener equipo:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
}

/**
 * POST /api/equipos
 * Registrar un equipo nuevo.
 */
async function crear(req, res) {
    try {
        const { nombre, tipo, serial, estado, observacion } = req.body;

        // Validar campos obligatorios
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ ok: false, mensaje: 'El nombre del equipo es obligatorio.' });
        }
        if (!tipo || !tipo.trim()) {
            return res.status(400).json({ ok: false, mensaje: 'El tipo del equipo es obligatorio.' });
        }
        if (!serial || !serial.trim()) {
            return res.status(400).json({ ok: false, mensaje: 'El serial del equipo es obligatorio.' });
        }

        // Validar estado si se proporciona
        const estadoFinal = estado ? estado.toUpperCase() : 'DISPONIBLE';
        if (!ESTADOS_VALIDOS.includes(estadoFinal)) {
            return res.status(400).json({
                ok: false,
                mensaje: `Estado no válido. Los estados permitidos son: ${ESTADOS_VALIDOS.join(', ')}.`
            });
        }

        // Validar serial único
        const serialExiste = await equiposData.existeSerial(serial.trim());
        if (serialExiste) {
            return res.status(400).json({ ok: false, mensaje: 'Ya existe un equipo con ese serial.' });
        }

        const equipo = await equiposData.crear({
            nombre: nombre.trim(),
            tipo: tipo.trim(),
            serial: serial.trim(),
            estado: estadoFinal,
            observacion: observacion ? observacion.trim() : null
        });

        res.status(201).json({ ok: true, mensaje: 'Equipo registrado exitosamente.', datos: equipo });
    } catch (error) {
        console.error('Error al crear equipo:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
}

/**
 * PUT /api/equipos/:id
 * Actualizar un equipo existente.
 */
async function actualizar(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ ok: false, mensaje: 'El ID debe ser un número válido.' });
        }

        const { nombre, tipo, serial, estado, observacion } = req.body;

        // Validar campos obligatorios
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ ok: false, mensaje: 'El nombre del equipo es obligatorio.' });
        }
        if (!tipo || !tipo.trim()) {
            return res.status(400).json({ ok: false, mensaje: 'El tipo del equipo es obligatorio.' });
        }
        if (!serial || !serial.trim()) {
            return res.status(400).json({ ok: false, mensaje: 'El serial del equipo es obligatorio.' });
        }

        // Validar estado
        const estadoFinal = estado ? estado.toUpperCase() : 'DISPONIBLE';
        if (!ESTADOS_VALIDOS.includes(estadoFinal)) {
            return res.status(400).json({
                ok: false,
                mensaje: `Estado no válido. Los estados permitidos son: ${ESTADOS_VALIDOS.join(', ')}.`
            });
        }

        // Verificar que el equipo existe
        const equipoExistente = await equiposData.obtenerPorId(id);
        if (!equipoExistente) {
            return res.status(404).json({ ok: false, mensaje: 'Equipo no encontrado.' });
        }

        // Validar serial único (excluyendo el equipo actual)
        const serialExiste = await equiposData.existeSerial(serial.trim(), id);
        if (serialExiste) {
            return res.status(400).json({ ok: false, mensaje: 'Ya existe otro equipo con ese serial.' });
        }

        const equipo = await equiposData.actualizar(id, {
            nombre: nombre.trim(),
            tipo: tipo.trim(),
            serial: serial.trim(),
            estado: estadoFinal,
            observacion: observacion ? observacion.trim() : null
        });

        res.status(200).json({ ok: true, mensaje: 'Equipo actualizado exitosamente.', datos: equipo });
    } catch (error) {
        console.error('Error al actualizar equipo:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
}

/**
 * DELETE /api/equipos/:id
 * Eliminar un equipo.
 */
async function eliminar(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ ok: false, mensaje: 'El ID debe ser un número válido.' });
        }

        // Verificar que el equipo existe
        const equipo = await equiposData.obtenerPorId(id);
        if (!equipo) {
            return res.status(404).json({ ok: false, mensaje: 'Equipo no encontrado.' });
        }

        // No permitir eliminar equipos que estén prestados
        if (equipo.ESTADO === 'PRESTADO') {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se puede eliminar un equipo que está prestado. Primero debe registrarse la devolución.'
            });
        }

        const eliminado = await equiposData.eliminar(id);

        if (eliminado) {
            res.status(200).json({ ok: true, mensaje: 'Equipo eliminado exitosamente.' });
        } else {
            res.status(500).json({ ok: false, mensaje: 'No se pudo eliminar el equipo.' });
        }
    } catch (error) {
        // Verificar si el error es por integridad referencial (préstamos asociados)
        if (error.message && error.message.includes('ORA-02292')) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se puede eliminar el equipo porque tiene préstamos asociados.'
            });
        }
        console.error('Error al eliminar equipo:', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
}

module.exports = {
    obtenerTodos,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
};

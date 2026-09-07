// ============================================================
// Capa de Datos - Préstamos
// ============================================================
// Contiene funciones SQL para préstamos.
// Las operaciones de crear préstamo y devolver usan TRANSACCIONES
// porque modifican tanto PRESTAMOS como EQUIPOS.
// ============================================================

const database = require('../config/database');
const oracledb = require('oracledb');

/**
 * Obtener todos los préstamos con el nombre del equipo.
 * @returns {Array} Lista de préstamos.
 */
async function obtenerTodos() {
    let conexion;
    try {
        conexion = await database.obtenerConexion();
        const resultado = await conexion.execute(
            `SELECT P.ID, P.EQUIPO_ID, E.NOMBRE AS EQUIPO_NOMBRE,
                    P.RESPONSABLE, P.IDENTIFICACION,
                    P.FECHA_PRESTAMO, P.FECHA_DEVOLUCION_PREVISTA,
                    P.ESTADO
             FROM PRESTAMOS P
             JOIN EQUIPOS E ON P.EQUIPO_ID = E.ID
             ORDER BY P.ID DESC`
        );
        return resultado.rows;
    } finally {
        if (conexion) await conexion.close();
    }
}

/**
 * Obtener un préstamo por su ID.
 * @param {number} id - ID del préstamo.
 * @returns {Object|null} Préstamo encontrado o null.
 */
async function obtenerPorId(id) {
    let conexion;
    try {
        conexion = await database.obtenerConexion();
        const resultado = await conexion.execute(
            `SELECT P.ID, P.EQUIPO_ID, E.NOMBRE AS EQUIPO_NOMBRE,
                    P.RESPONSABLE, P.IDENTIFICACION,
                    P.FECHA_PRESTAMO, P.FECHA_DEVOLUCION_PREVISTA,
                    P.ESTADO
             FROM PRESTAMOS P
             JOIN EQUIPOS E ON P.EQUIPO_ID = E.ID
             WHERE P.ID = :id`,
            { id }
        );
        return resultado.rows.length > 0 ? resultado.rows[0] : null;
    } finally {
        if (conexion) await conexion.close();
    }
}

/**
 * Crear un nuevo préstamo.
 * TRANSACCIÓN: Inserta en PRESTAMOS y actualiza EQUIPOS (DISPONIBLE -> PRESTADO).
 * Si cualquiera falla, hace ROLLBACK.
 * @param {Object} prestamo - Datos del préstamo.
 * @returns {Object} Préstamo creado.
 */
async function crear(prestamo) {
    let conexion;
    try {
        conexion = await database.obtenerConexion();

        // --- INICIO DE TRANSACCIÓN (autoCommit: false) ---

        // 1. Insertar el préstamo
        const resultadoInsert = await conexion.execute(
            `INSERT INTO PRESTAMOS (EQUIPO_ID, RESPONSABLE, IDENTIFICACION,
                                     FECHA_PRESTAMO, FECHA_DEVOLUCION_PREVISTA, ESTADO)
             VALUES (:equipo_id, :responsable, :identificacion,
                     TO_DATE(:fecha_prestamo, 'YYYY-MM-DD'),
                     TO_DATE(:fecha_devolucion_prevista, 'YYYY-MM-DD'),
                     'ACTIVO')
             RETURNING ID INTO :id`,
            {
                equipo_id: prestamo.equipo_id,
                responsable: prestamo.responsable,
                identificacion: prestamo.identificacion,
                fecha_prestamo: prestamo.fecha_prestamo,
                fecha_devolucion_prevista: prestamo.fecha_devolucion_prevista,
                id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            { autoCommit: false }  // NO hacer commit todavía
        );

        // 2. Cambiar estado del equipo: DISPONIBLE -> PRESTADO
        await conexion.execute(
            `UPDATE EQUIPOS SET ESTADO = 'PRESTADO' WHERE ID = :equipo_id`,
            { equipo_id: prestamo.equipo_id },
            { autoCommit: false }
        );

        // 3. COMMIT: ambas operaciones fueron exitosas
        await conexion.commit();

        // Obtener el préstamo completo para retornarlo
        const nuevoId = resultadoInsert.outBinds.id[0];
        return await obtenerPorId(nuevoId);

    } catch (error) {
        // ROLLBACK: si algo falló, deshacer todo
        if (conexion) {
            try { await conexion.rollback(); } catch (e) { /* ignorar */ }
        }
        throw error;
    } finally {
        if (conexion) await conexion.close();
    }
}

/**
 * Registrar devolución de un préstamo.
 * TRANSACCIÓN: Actualiza PRESTAMOS (ACTIVO -> DEVUELTO) y EQUIPOS (PRESTADO -> DISPONIBLE).
 * Si cualquiera falla, hace ROLLBACK.
 * @param {number} id - ID del préstamo a devolver.
 * @returns {Object} Préstamo actualizado.
 */
async function devolver(id) {
    let conexion;
    try {
        conexion = await database.obtenerConexion();

        // --- INICIO DE TRANSACCIÓN ---

        // 1. Obtener datos del préstamo para saber el equipo_id
        const resultadoPrestamo = await conexion.execute(
            `SELECT EQUIPO_ID, ESTADO FROM PRESTAMOS WHERE ID = :id`,
            { id }
        );

        if (resultadoPrestamo.rows.length === 0) {
            return null; // Préstamo no encontrado
        }

        const prestamo = resultadoPrestamo.rows[0];

        if (prestamo.ESTADO === 'DEVUELTO') {
            const error = new Error('Este préstamo ya fue devuelto anteriormente.');
            error.tipo = 'NEGOCIO';
            throw error;
        }

        // 2. Cambiar estado del préstamo: ACTIVO -> DEVUELTO
        await conexion.execute(
            `UPDATE PRESTAMOS SET ESTADO = 'DEVUELTO' WHERE ID = :id`,
            { id },
            { autoCommit: false }
        );

        // 3. Cambiar estado del equipo: PRESTADO -> DISPONIBLE
        await conexion.execute(
            `UPDATE EQUIPOS SET ESTADO = 'DISPONIBLE' WHERE ID = :equipo_id`,
            { equipo_id: prestamo.EQUIPO_ID },
            { autoCommit: false }
        );

        // 4. COMMIT: ambas operaciones exitosas
        await conexion.commit();

        return await obtenerPorId(id);

    } catch (error) {
        // ROLLBACK: deshacer si algo falló
        if (conexion) {
            try { await conexion.rollback(); } catch (e) { /* ignorar */ }
        }
        throw error;
    } finally {
        if (conexion) await conexion.close();
    }
}

/**
 * Eliminar un préstamo DEVUELTO por su ID.
 * Solo se permite eliminar préstamos con estado DEVUELTO.
 * @param {number} id - ID del préstamo a eliminar.
 * @returns {boolean} true si se eliminó.
 */
async function eliminarDevuelto(id) {
    let conexion;
    try {
        conexion = await database.obtenerConexion();
        const resultado = await conexion.execute(
            `DELETE FROM PRESTAMOS WHERE ID = :id AND ESTADO = 'DEVUELTO'`,
            { id },
            { autoCommit: true }
        );
        return resultado.rowsAffected > 0;
    } finally {
        if (conexion) await conexion.close();
    }
}

/**
 * Eliminar todos los préstamos con estado DEVUELTO.
 * Nunca toca préstamos ACTIVOS.
 * @returns {number} Cantidad de registros eliminados.
 */
async function eliminarTodosDevueltos() {
    let conexion;
    try {
        conexion = await database.obtenerConexion();
        const resultado = await conexion.execute(
            `DELETE FROM PRESTAMOS WHERE ESTADO = 'DEVUELTO'`,
            {},
            { autoCommit: true }
        );
        return resultado.rowsAffected;
    } finally {
        if (conexion) await conexion.close();
    }
}

module.exports = {
    obtenerTodos,
    obtenerPorId,
    crear,
    devolver,
    eliminarDevuelto,
    eliminarTodosDevueltos
};

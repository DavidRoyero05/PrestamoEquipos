// ============================================================
// Capa de Datos - Equipos
// ============================================================
// Contiene las funciones que ejecutan consultas SQL contra Oracle.
// Todas las consultas usan bind variables (parámetros) para
// prevenir inyección SQL.
// ============================================================

const database = require('../config/database');

/**
 * Obtener todos los equipos.
 * @returns {Array} Lista de equipos.
 */
async function obtenerTodos() {
    let conexion;
    try {
        conexion = await database.obtenerConexion();
        const resultado = await conexion.execute(
            `SELECT ID, NOMBRE, TIPO, SERIAL, ESTADO, OBSERVACION
             FROM EQUIPOS
             ORDER BY ID`
        );
        return resultado.rows;
    } finally {
        if (conexion) await conexion.close();
    }
}

/**
 * Obtener un equipo por su ID.
 * @param {number} id - ID del equipo.
 * @returns {Object|null} Equipo encontrado o null.
 */
async function obtenerPorId(id) {
    let conexion;
    try {
        conexion = await database.obtenerConexion();
        const resultado = await conexion.execute(
            `SELECT ID, NOMBRE, TIPO, SERIAL, ESTADO, OBSERVACION
             FROM EQUIPOS
             WHERE ID = :id`,
            { id }
        );
        return resultado.rows.length > 0 ? resultado.rows[0] : null;
    } finally {
        if (conexion) await conexion.close();
    }
}

/**
 * Verificar si un serial ya existe (para validar unicidad).
 * @param {string} serial - Serial a verificar.
 * @param {number|null} excluirId - ID a excluir (para edición).
 * @returns {boolean} true si el serial ya existe.
 */
async function existeSerial(serial, excluirId = null) {
    let conexion;
    try {
        conexion = await database.obtenerConexion();
        let sql = `SELECT COUNT(*) AS TOTAL FROM EQUIPOS WHERE UPPER(SERIAL) = UPPER(:serial)`;
        const params = { serial };

        if (excluirId) {
            sql += ` AND ID != :excluirId`;
            params.excluirId = excluirId;
        }

        const resultado = await conexion.execute(sql, params);
        return resultado.rows[0].TOTAL > 0;
    } finally {
        if (conexion) await conexion.close();
    }
}

/**
 * Crear un nuevo equipo.
 * @param {Object} equipo - Datos del equipo { nombre, tipo, serial, estado, observacion }.
 * @returns {Object} Equipo creado con su ID.
 */
async function crear(equipo) {
    let conexion;
    try {
        conexion = await database.obtenerConexion();
        const resultado = await conexion.execute(
            `INSERT INTO EQUIPOS (NOMBRE, TIPO, SERIAL, ESTADO, OBSERVACION)
             VALUES (:nombre, :tipo, :serial, :estado, :observacion)
             RETURNING ID INTO :id`,
            {
                nombre: equipo.nombre,
                tipo: equipo.tipo,
                serial: equipo.serial,
                estado: equipo.estado || 'DISPONIBLE',
                observacion: equipo.observacion || null,
                id: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }
            },
            { autoCommit: true }
        );
        const nuevoId = resultado.outBinds.id[0];
        return await obtenerPorId(nuevoId);
    } finally {
        if (conexion) await conexion.close();
    }
}

/**
 * Actualizar un equipo existente.
 * @param {number} id - ID del equipo a actualizar.
 * @param {Object} equipo - Datos actualizados.
 * @returns {Object|null} Equipo actualizado o null si no existe.
 */
async function actualizar(id, equipo) {
    let conexion;
    try {
        conexion = await database.obtenerConexion();
        const resultado = await conexion.execute(
            `UPDATE EQUIPOS
             SET NOMBRE = :nombre,
                 TIPO = :tipo,
                 SERIAL = :serial,
                 ESTADO = :estado,
                 OBSERVACION = :observacion
             WHERE ID = :id`,
            {
                nombre: equipo.nombre,
                tipo: equipo.tipo,
                serial: equipo.serial,
                estado: equipo.estado,
                observacion: equipo.observacion || null,
                id: id
            },
            { autoCommit: true }
        );
        if (resultado.rowsAffected === 0) return null;
        return await obtenerPorId(id);
    } finally {
        if (conexion) await conexion.close();
    }
}

/**
 * Eliminar un equipo por su ID.
 * @param {number} id - ID del equipo a eliminar.
 * @returns {boolean} true si se eliminó, false si no existía.
 */
async function eliminar(id) {
    let conexion;
    try {
        conexion = await database.obtenerConexion();
        const resultado = await conexion.execute(
            `DELETE FROM EQUIPOS WHERE ID = :id`,
            { id },
            { autoCommit: true }
        );
        return resultado.rowsAffected > 0;
    } finally {
        if (conexion) await conexion.close();
    }
}

module.exports = {
    obtenerTodos,
    obtenerPorId,
    existeSerial,
    crear,
    actualizar,
    eliminar
};

// ============================================================
// Configuración de conexión a Oracle Database
// ============================================================
// Centraliza la creación y cierre del pool de conexiones Oracle.
// Usa variables de entorno desde .env (cargadas en server.js).
// ============================================================

const oracledb = require('oracledb');

// Configuración del formato de salida de oracledb
// outFormat: OBJECT hace que las filas se devuelvan como objetos JS
// en lugar de arrays, facilitando el acceso por nombre de columna.
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

/**
 * Inicializa el pool de conexiones a Oracle.
 * Se llama una sola vez al iniciar el servidor.
 */
async function inicializar() {
    try {
        await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING,
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 1
        });
        console.log('✅ Pool de conexiones Oracle creado exitosamente.');
    } catch (error) {
        console.error('❌ Error al crear pool de conexiones Oracle:', error.message);
        throw error;
    }
}

/**
 * Obtiene una conexión del pool.
 * IMPORTANTE: Siempre liberar la conexión después de usarla con connection.close()
 */
async function obtenerConexion() {
    const conexion = await oracledb.getConnection();
    return conexion;
}

/**
 * Cierra el pool de conexiones.
 * Se llama al detener el servidor.
 */
async function cerrar() {
    try {
        await oracledb.getPool().close(2);
        console.log('🔒 Pool de conexiones Oracle cerrado.');
    } catch (error) {
        console.error('❌ Error al cerrar pool Oracle:', error.message);
    }
}

module.exports = { inicializar, obtenerConexion, cerrar };

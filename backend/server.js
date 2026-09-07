// ============================================================
// Punto de entrada del servidor
// ============================================================
// Carga variables de entorno, inicializa Oracle y arranca Express.
// ============================================================

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const app = require('./app');
const database = require('./config/database');

const PORT = process.env.PORT || 3000;

/**
 * Inicia el servidor:
 * 1. Crea el pool de conexiones Oracle.
 * 2. Inicia Express en el puerto configurado.
 */
async function iniciar() {
    try {
        // Inicializar pool de conexiones Oracle
        await database.inicializar();

        // Iniciar servidor Express
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📡 API disponible en http://localhost:${PORT}/api/equipos`);
            console.log(`📡 API disponible en http://localhost:${PORT}/api/prestamos`);
        });
    } catch (error) {
        console.error('❌ No se pudo iniciar el servidor:', error.message);
        process.exit(1);
    }
}

// Manejo de señales de cierre para liberar recursos
process.on('SIGINT', async () => {
    console.log('\n🛑 Deteniendo servidor...');
    await database.cerrar();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Deteniendo servidor...');
    await database.cerrar();
    process.exit(0);
});

// Arrancar el servidor
iniciar();

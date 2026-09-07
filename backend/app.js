// ============================================================
// Configuración de la aplicación Express
// ============================================================
// Configura middlewares (cors, json) y monta las rutas de la API.
// Se exporta para ser usado por server.js.
// ============================================================

const express = require('express');
const cors = require('cors');
const equiposRoutes = require('./routes/equiposRoutes');
const prestamosRoutes = require('./routes/prestamosRoutes');

const app = express();

// ---- Middlewares ----

// Habilitar CORS para permitir peticiones desde el frontend
app.use(cors());

// Parsear cuerpos JSON en las peticiones
app.use(express.json());

// ---- Rutas de la API ----

app.use('/api/equipos', equiposRoutes);
app.use('/api/prestamos', prestamosRoutes);

// ---- Ruta raíz (verificación rápida) ----

app.get('/', (req, res) => {
    res.json({
        ok: true,
        mensaje: 'API del Sistema de Préstamo de Equipos Tecnológicos funcionando correctamente.',
        endpoints: {
            equipos: '/api/equipos',
            prestamos: '/api/prestamos'
        }
    });
});

// ---- Manejo de rutas no encontradas ----

app.use((req, res) => {
    res.status(404).json({
        ok: false,
        mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    });
});

// ---- Manejo global de errores ----

app.use((error, req, res, next) => {
    console.error('Error no controlado:', error.message);
    res.status(500).json({
        ok: false,
        mensaje: 'Error interno del servidor.'
    });
});

module.exports = app;

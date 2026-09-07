// ============================================================
// Módulo API - Funciones fetch() para consumir la API REST
// ============================================================
// Centraliza todas las llamadas HTTP al backend.
// Cada función usa async/await y retorna objetos JSON.
// ============================================================

// URL base de la API (backend Express)
const BASE_URL = 'http://localhost:3000/api';

// ============================================================
// EQUIPOS
// ============================================================

/**
 * Obtener todos los equipos.
 * @returns {Object} Respuesta JSON { ok, datos }.
 */
export async function obtenerEquipos() {
    const respuesta = await fetch(`${BASE_URL}/equipos`);
    const datos = await respuesta.json();
    return datos;
}

/**
 * Obtener un equipo por su ID.
 * @param {number} id - ID del equipo.
 * @returns {Object} Respuesta JSON { ok, datos }.
 */
export async function obtenerEquipoPorId(id) {
    const respuesta = await fetch(`${BASE_URL}/equipos/${id}`);
    const datos = await respuesta.json();
    return datos;
}

/**
 * Crear un nuevo equipo.
 * @param {Object} equipo - Datos del equipo { nombre, tipo, serial, estado, observacion }.
 * @returns {Object} Respuesta JSON { ok, mensaje, datos }.
 */
export async function crearEquipo(equipo) {
    const respuesta = await fetch(`${BASE_URL}/equipos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipo)
    });
    const datos = await respuesta.json();
    return datos;
}

/**
 * Actualizar un equipo existente.
 * @param {number} id - ID del equipo.
 * @param {Object} equipo - Datos actualizados.
 * @returns {Object} Respuesta JSON { ok, mensaje, datos }.
 */
export async function actualizarEquipo(id, equipo) {
    const respuesta = await fetch(`${BASE_URL}/equipos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipo)
    });
    const datos = await respuesta.json();
    return datos;
}

/**
 * Eliminar un equipo.
 * @param {number} id - ID del equipo.
 * @returns {Object} Respuesta JSON { ok, mensaje }.
 */
export async function eliminarEquipo(id) {
    const respuesta = await fetch(`${BASE_URL}/equipos/${id}`, {
        method: 'DELETE'
    });
    const datos = await respuesta.json();
    return datos;
}

// ============================================================
// PRÉSTAMOS
// ============================================================

/**
 * Obtener todos los préstamos.
 * @returns {Object} Respuesta JSON { ok, datos }.
 */
export async function obtenerPrestamos() {
    const respuesta = await fetch(`${BASE_URL}/prestamos`);
    const datos = await respuesta.json();
    return datos;
}

/**
 * Crear un nuevo préstamo.
 * @param {Object} prestamo - Datos del préstamo.
 * @returns {Object} Respuesta JSON { ok, mensaje, datos }.
 */
export async function crearPrestamo(prestamo) {
    const respuesta = await fetch(`${BASE_URL}/prestamos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prestamo)
    });
    const datos = await respuesta.json();
    return datos;
}

/**
 * Registrar la devolución de un préstamo.
 * @param {number} id - ID del préstamo.
 * @returns {Object} Respuesta JSON { ok, mensaje, datos }.
 */
export async function devolverPrestamo(id) {
    const respuesta = await fetch(`${BASE_URL}/prestamos/${id}/devolver`, {
        method: 'PUT'
    });
    const datos = await respuesta.json();
    return datos;
}

/**
 * Eliminar un préstamo devuelto del historial.
 * @param {number} id - ID del préstamo.
 * @returns {Object} Respuesta JSON { ok, mensaje }.
 */
export async function eliminarPrestamo(id) {
    const respuesta = await fetch(`${BASE_URL}/prestamos/${id}`, {
        method: 'DELETE'
    });
    const datos = await respuesta.json();
    return datos;
}

/**
 * Eliminar todos los préstamos devueltos del historial.
 * @returns {Object} Respuesta JSON { ok, mensaje, eliminados }.
 */
export async function eliminarPrestamosDevueltos() {
    const respuesta = await fetch(`${BASE_URL}/prestamos/devueltos`, {
        method: 'DELETE'
    });
    const datos = await respuesta.json();
    return datos;
}

// ============================================================
// Módulo Principal (app.js) - Coordinador de eventos y flujo
// ============================================================
// Este archivo coordina la interacción entre la API y la interfaz.
// Registra todos los addEventListener y controla el flujo de la app.
// ============================================================

import {
    obtenerEquipos,
    crearEquipo,
    actualizarEquipo,
    eliminarEquipo,
    obtenerPrestamos,
    crearPrestamo,
    devolverPrestamo,
    eliminarPrestamo,
    eliminarPrestamosDevueltos
} from './api.js';

import {
    actualizarTarjetas,
    renderizarTablaEquipos,
    renderizarPrestamosActivos,
    renderizarHistorialPrestamos,
    llenarSelectorEquipos,
    llenarFormularioEquipo,
    limpiarFormularioEquipo,
    limpiarFormularioPrestamo,
    mostrarToast,
    confirmar,
    cambiarSeccion
} from './interfaz.js';

// ============================================================
// ESTADO DE LA APLICACIÓN
// ============================================================
// Arreglos que almacenan los datos recibidos de la API.
// Se usan para filtrado/búsqueda local sin llamar de nuevo al servidor.
let equipos = [];
let prestamos = [];

// ============================================================
// FUNCIONES DE CARGA DE DATOS
// ============================================================

/**
 * Cargar equipos desde la API y actualizar la interfaz.
 */
async function cargarEquipos() {
    try {
        const respuesta = await obtenerEquipos();
        if (respuesta.ok) {
            equipos = respuesta.datos;
            aplicarFiltrosEquipos();
            llenarSelectorEquipos(equipos);
        } else {
            mostrarToast('Error al cargar equipos: ' + respuesta.mensaje, 'error');
        }
    } catch (error) {
        console.error('Error de conexión al cargar equipos:', error);
        mostrarToast('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.', 'error');
    }
}

/**
 * Cargar préstamos desde la API y actualizar la interfaz.
 */
async function cargarPrestamos() {
    try {
        const respuesta = await obtenerPrestamos();
        if (respuesta.ok) {
            prestamos = respuesta.datos;
            renderizarPrestamosActivos(prestamos, manejarDevolver);
            renderizarHistorialPrestamos(prestamos, manejarEliminarPrestamo);
        } else {
            mostrarToast('Error al cargar préstamos: ' + respuesta.mensaje, 'error');
        }
    } catch (error) {
        console.error('Error de conexión al cargar préstamos:', error);
        mostrarToast('No se pudo conectar con el servidor.', 'error');
    }
}

/**
 * Cargar todos los datos y actualizar el panel.
 */
async function cargarTodo() {
    await cargarEquipos();
    await cargarPrestamos();
    actualizarTarjetas(equipos, prestamos);
}

// ============================================================
// FILTROS
// ============================================================

/**
 * Aplicar filtros de búsqueda y estado a la tabla de equipos.
 */
function aplicarFiltrosEquipos() {
    const busqueda = document.getElementById('busqueda-equipo').value;
    const filtroEstado = document.getElementById('filtro-estado-equipo').value;

    renderizarTablaEquipos(equipos, busqueda, filtroEstado, manejarEditarEquipo, manejarEliminarEquipo);
}



// ============================================================
// MANEJADORES DE EQUIPOS
// ============================================================

/**
 * Manejar el envío del formulario de equipos (crear o actualizar).
 * @param {Event} evento - Evento submit del formulario.
 */
async function manejarSubmitEquipo(evento) {
    evento.preventDefault();

    const id = document.getElementById('equipo-id').value;
    const nombre = document.getElementById('equipo-nombre').value;
    const tipo = document.getElementById('equipo-tipo').value;
    const serial = document.getElementById('equipo-serial').value;
    const estado = document.getElementById('equipo-estado').value;
    const observacion = document.getElementById('equipo-observacion').value;

    // Validación básica en frontend
    if (!nombre.trim() || !tipo.trim() || !serial.trim()) {
        mostrarToast('Por favor complete todos los campos obligatorios.', 'error');
        return;
    }

    const datosEquipo = { nombre, tipo, serial, estado, observacion };

    try {
        let respuesta;
        if (id) {
            // Actualizar equipo existente
            respuesta = await actualizarEquipo(parseInt(id), datosEquipo);
        } else {
            // Crear equipo nuevo
            respuesta = await crearEquipo(datosEquipo);
        }

        if (respuesta.ok) {
            mostrarToast(respuesta.mensaje, 'exito');
            limpiarFormularioEquipo();
            await cargarTodo();
        } else {
            mostrarToast(respuesta.mensaje, 'error');
        }
    } catch (error) {
        console.error('Error al guardar equipo:', error);
        mostrarToast('Error de conexión con el servidor.', 'error');
    }
}

/**
 * Manejar clic en botón editar de un equipo.
 * @param {Object} equipo - Datos del equipo a editar.
 */
function manejarEditarEquipo(equipo) {
    llenarFormularioEquipo(equipo);
}

/**
 * Manejar clic en botón eliminar de un equipo.
 * @param {Object} equipo - Datos del equipo a eliminar.
 */
async function manejarEliminarEquipo(equipo) {
    const confirmado = await confirmar(
        `¿Está seguro de eliminar el equipo "${equipo.NOMBRE}" (${equipo.SERIAL})?`
    );

    if (!confirmado) return;

    try {
        const respuesta = await eliminarEquipo(equipo.ID);
        if (respuesta.ok) {
            mostrarToast(respuesta.mensaje, 'exito');
            await cargarTodo();
        } else {
            mostrarToast(respuesta.mensaje, 'error');
        }
    } catch (error) {
        console.error('Error al eliminar equipo:', error);
        mostrarToast('Error de conexión con el servidor.', 'error');
    }
}

// ============================================================
// MANEJADORES DE PRÉSTAMOS
// ============================================================

/**
 * Manejar el envío del formulario de préstamos.
 * @param {Event} evento - Evento submit del formulario.
 */
async function manejarSubmitPrestamo(evento) {
    evento.preventDefault();

    const equipo_id = document.getElementById('prestamo-equipo').value;
    const responsable = document.getElementById('prestamo-responsable').value;
    const identificacion = document.getElementById('prestamo-identificacion').value;
    const fecha_prestamo = document.getElementById('prestamo-fecha').value;
    const fecha_devolucion_prevista = document.getElementById('prestamo-fecha-devolucion').value;

    // Validación básica en frontend
    if (!equipo_id) {
        mostrarToast('Debe seleccionar un equipo.', 'error');
        return;
    }
    if (!responsable.trim()) {
        mostrarToast('El responsable es obligatorio.', 'error');
        return;
    }
    if (!identificacion.trim()) {
        mostrarToast('La identificación es obligatoria.', 'error');
        return;
    }
    if (!fecha_prestamo) {
        mostrarToast('La fecha de préstamo es obligatoria.', 'error');
        return;
    }
    if (!fecha_devolucion_prevista) {
        mostrarToast('La fecha de devolución prevista es obligatoria.', 'error');
        return;
    }

    // Validar que fecha devolución no sea anterior a fecha préstamo
    if (fecha_devolucion_prevista < fecha_prestamo) {
        mostrarToast('La fecha de devolución no puede ser anterior a la fecha de préstamo.', 'error');
        return;
    }

    const datosPrestamo = {
        equipo_id: parseInt(equipo_id),
        responsable,
        identificacion,
        fecha_prestamo,
        fecha_devolucion_prevista
    };

    try {
        const respuesta = await crearPrestamo(datosPrestamo);
        if (respuesta.ok) {
            mostrarToast(respuesta.mensaje, 'exito');
            limpiarFormularioPrestamo();
            await cargarTodo();
        } else {
            mostrarToast(respuesta.mensaje, 'error');
        }
    } catch (error) {
        console.error('Error al registrar préstamo:', error);
        mostrarToast('Error de conexión con el servidor.', 'error');
    }
}

/**
 * Manejar clic en botón devolver de un préstamo.
 * @param {Object} prestamo - Datos del préstamo a devolver.
 */
async function manejarDevolver(prestamo) {
    const confirmado = await confirmar(
        `¿Confirma la devolución del equipo "${prestamo.EQUIPO_NOMBRE}" prestado a ${prestamo.RESPONSABLE}?`
    );

    if (!confirmado) return;

    try {
        const respuesta = await devolverPrestamo(prestamo.ID);
        if (respuesta.ok) {
            mostrarToast(respuesta.mensaje, 'exito');
            await cargarTodo();
        } else {
            mostrarToast(respuesta.mensaje, 'error');
        }
    } catch (error) {
        console.error('Error al registrar devolución:', error);
        mostrarToast('Error de conexión con el servidor.', 'error');
    }
}

/**
 * Manejar clic en botón eliminar de un préstamo devuelto.
 * @param {Object} prestamo - Datos del préstamo a eliminar.
 */
async function manejarEliminarPrestamo(prestamo) {
    const confirmado = await confirmar(
        `¿Seguro que deseas eliminar este registro del historial? Esta acción no se puede deshacer.`
    );

    if (!confirmado) return;

    try {
        const respuesta = await eliminarPrestamo(prestamo.ID);
        if (respuesta.ok) {
            mostrarToast(respuesta.mensaje, 'exito');
            await cargarTodo();
        } else {
            mostrarToast(respuesta.mensaje, 'error');
        }
    } catch (error) {
        console.error('Error al eliminar préstamo:', error);
        mostrarToast('Error de conexión con el servidor.', 'error');
    }
}

/**
 * Manejar clic en botón eliminar todos los devueltos.
 */
async function manejarEliminarTodosDevueltos() {
    const devueltos = prestamos.filter(p => p.ESTADO === 'DEVUELTO');
    if (devueltos.length === 0) {
        mostrarToast('No hay préstamos devueltos para eliminar.', 'error');
        return;
    }

    const confirmado = await confirmar(
        `¿Seguro que deseas eliminar todos los préstamos devueltos del historial? Esta acción no se puede deshacer.`
    );

    if (!confirmado) return;

    try {
        const respuesta = await eliminarPrestamosDevueltos();
        if (respuesta.ok) {
            mostrarToast(`${respuesta.mensaje} (${respuesta.eliminados} registros)`, 'exito');
            await cargarTodo();
        } else {
            mostrarToast(respuesta.mensaje, 'error');
        }
    } catch (error) {
        console.error('Error al eliminar préstamos devueltos:', error);
        mostrarToast('Error de conexión con el servidor.', 'error');
    }
}

// ============================================================
// REGISTRO DE EVENTOS (addEventListener)
// ============================================================

/**
 * Inicializar la aplicación: registrar eventos y cargar datos.
 */
function inicializar() {
    // ---- Navegación ----
    const botonesNav = document.querySelectorAll('.nav__btn');
    botonesNav.forEach(btn => {
        btn.addEventListener('click', (evento) => {
            const seccion = evento.currentTarget.dataset.seccion;
            cambiarSeccion(seccion);

            // Recargar datos al cambiar de sección
            if (seccion === 'panel') {
                cargarTodo();
            } else if (seccion === 'equipos') {
                cargarEquipos();
            } else if (seccion === 'prestamos') {
                cargarPrestamos();
                cargarEquipos(); // Para actualizar el selector de equipos disponibles
            }
        });
    });

    // ---- Formulario de equipos (evento submit) ----
    const formEquipo = document.getElementById('form-equipo');
    formEquipo.addEventListener('submit', manejarSubmitEquipo);

    // ---- Botón cancelar edición de equipo ----
    const btnCancelar = document.getElementById('btn-cancelar-equipo');
    btnCancelar.addEventListener('click', () => {
        limpiarFormularioEquipo();
    });

    // ---- Formulario de préstamos (evento submit) ----
    const formPrestamo = document.getElementById('form-prestamo');
    formPrestamo.addEventListener('submit', manejarSubmitPrestamo);

    // ---- Búsqueda de equipos (evento input) ----
    const busquedaEquipo = document.getElementById('busqueda-equipo');
    busquedaEquipo.addEventListener('input', () => {
        aplicarFiltrosEquipos();
    });

    // ---- Filtro de estado de equipos (evento change) ----
    const filtroEstadoEquipo = document.getElementById('filtro-estado-equipo');
    filtroEstadoEquipo.addEventListener('change', () => {
        aplicarFiltrosEquipos();
    });

    // ---- Botón eliminar todos los devueltos (evento click) ----
    const btnEliminarTodosDevueltos = document.getElementById('btn-eliminar-todos-devueltos');
    btnEliminarTodosDevueltos.addEventListener('click', manejarEliminarTodosDevueltos);

    // ---- Establecer fecha por defecto en el formulario de préstamo ----
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('prestamo-fecha').value = hoy;

    // ---- Cargar datos iniciales ----
    cargarTodo();
}

// ============================================================
// INICIAR APLICACIÓN CUANDO EL DOM ESTÉ LISTO
// ============================================================
document.addEventListener('DOMContentLoaded', inicializar);

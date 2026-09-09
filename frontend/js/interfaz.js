// ============================================================
// Módulo Interfaz - Funciones para manipular el DOM
// ============================================================
// Contiene funciones para crear/modificar elementos del DOM:
// tablas, tarjetas, mensajes toast, badges, selectores, etc.
// ============================================================

// ============================================================
// TARJETAS DEL PANEL
// ============================================================

/**
 * Actualizar las tarjetas del panel principal con datos de la API.
 * @param {Array} equipos - Lista de equipos.
 * @param {Array} prestamos - Lista de préstamos.
 */
export function actualizarTarjetas(equipos, prestamos) {
    const totalEquipos = equipos.length;
    const disponibles = equipos.filter(e => e.ESTADO === 'DISPONIBLE').length;
    const prestados = equipos.filter(e => e.ESTADO === 'PRESTADO').length;
    const mantenimiento = equipos.filter(e => e.ESTADO === 'MANTENIMIENTO').length;
    const prestamosActivos = prestamos.filter(p => p.ESTADO === 'ACTIVO').length;

    const elTotal = document.getElementById('total-equipos');
    const elDisp = document.getElementById('total-disponibles');
    const elPrest = document.getElementById('total-prestados');
    const elMant = document.getElementById('total-mantenimiento');
    const elActivos = document.getElementById('total-prestamos-activos');

    if (elTotal) elTotal.textContent = totalEquipos;
    if (elDisp) elDisp.textContent = disponibles;
    if (elPrest) elPrest.textContent = prestados;
    if (elMant) elMant.textContent = mantenimiento;
    if (elActivos) elActivos.textContent = prestamosActivos;

    // --- Resumen visual: Estado del Laboratorio ---
    const pctDisp = totalEquipos > 0 ? Math.round((disponibles / totalEquipos) * 100) : 0;
    const pctPrest = totalEquipos > 0 ? Math.round((prestados / totalEquipos) * 100) : 0;
    const pctMant = totalEquipos > 0 ? Math.max(0, 100 - pctDisp - pctPrest) : 0;

    const barraDisp = document.getElementById('barra-disp');
    const barraPrest = document.getElementById('barra-prest');
    const barraMant = document.getElementById('barra-mant');
    if (barraDisp) barraDisp.style.width = `${pctDisp}%`;
    if (barraPrest) barraPrest.style.width = `${pctPrest}%`;
    if (barraMant) barraMant.style.width = `${pctMant}%`;

    const elPctDisp = document.getElementById('pct-disponibles');
    const elPctPrest = document.getElementById('pct-prestados');
    const elPctMant = document.getElementById('pct-mantenimiento');
    if (elPctDisp) elPctDisp.textContent = `${pctDisp}%`;
    if (elPctPrest) elPctPrest.textContent = `${pctPrest}%`;
    if (elPctMant) elPctMant.textContent = `${pctMant}%`;

    const elCntDisp = document.getElementById('cnt-disponibles');
    const elCntPrest = document.getElementById('cnt-prestados');
    const elCntMant = document.getElementById('cnt-mantenimiento');
    if (elCntDisp) elCntDisp.textContent = `(${disponibles} equipos)`;
    if (elCntPrest) elCntPrest.textContent = `(${prestados} equipos)`;
    if (elCntMant) elCntMant.textContent = `(${mantenimiento} equipos)`;

    // --- Resumen visual: Actividad Reciente ---
    const contenedorActividad = document.getElementById('lista-actividad-reciente');
    if (contenedorActividad) {
        if (!prestamos || prestamos.length === 0) {
            contenedorActividad.innerHTML = '<p class="tabla__vacio" id="actividad-vacio">No hay registros de actividad reciente.</p>';
        } else {
            // Ordenar por ID descendente para mostrar los últimos registrados
            const recientes = [...prestamos].sort((a, b) => (b.ID || 0) - (a.ID || 0)).slice(0, 5);
            contenedorActividad.innerHTML = recientes.map(p => {
                const esActivo = p.ESTADO === 'ACTIVO';
                const claseBadge = esActivo ? 'badge--activo' : 'badge--devuelto';
                const textoEstado = esActivo ? 'ACTIVO' : 'DEVUELTO';
                const icono = esActivo ? '📤' : '📥';
                return `
                    <div class="actividad-fila">
                        <div class="actividad-fila__icono">${icono}</div>
                        <div class="actividad-fila__info">
                            <strong class="actividad-fila__equipo">${p.EQUIPO_NOMBRE || 'Equipo #' + p.EQUIPO_ID}</strong>
                            <span class="actividad-fila__responsable">${p.RESPONSABLE} &bull; ID: ${p.IDENTIFICACION}</span>
                        </div>
                        <div class="actividad-fila__meta">
                            <span class="badge ${claseBadge}">${textoEstado}</span>
                            <span class="actividad-fila__fecha">${formatearFecha(p.FECHA_PRESTAMO)}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

// ============================================================
// TABLA DE EQUIPOS
// ============================================================

/**
 * Renderizar la tabla de equipos filtrando por búsqueda y estado.
 * @param {Array} equipos - Lista completa de equipos.
 * @param {string} busqueda - Texto de búsqueda.
 * @param {string} filtroEstado - Estado para filtrar (TODOS, DISPONIBLE, PRESTADO, MANTENIMIENTO).
 * @param {Function} onEditar - Callback cuando se hace clic en editar.
 * @param {Function} onEliminar - Callback cuando se hace clic en eliminar.
 */
export function renderizarTablaEquipos(equipos, busqueda, filtroEstado, onEditar, onEliminar) {
    const cuerpo = document.getElementById('cuerpo-tabla-equipos');
    const mensajeVacio = document.getElementById('equipos-vacio');
    const tabla = document.getElementById('tabla-equipos');

    // Filtrar equipos
    let equiposFiltrados = equipos;

    // Filtrar por estado
    if (filtroEstado && filtroEstado !== 'TODOS') {
        equiposFiltrados = equiposFiltrados.filter(e => e.ESTADO === filtroEstado);
    }

    // Filtrar por búsqueda (nombre o serial)
    if (busqueda && busqueda.trim() !== '') {
        const termino = busqueda.toLowerCase().trim();
        equiposFiltrados = equiposFiltrados.filter(e =>
            e.NOMBRE.toLowerCase().includes(termino) ||
            e.SERIAL.toLowerCase().includes(termino)
        );
    }

    // Limpiar tabla
    cuerpo.innerHTML = '';

    if (equiposFiltrados.length === 0) {
        tabla.style.display = 'none';
        mensajeVacio.style.display = 'block';
        mensajeVacio.textContent = busqueda || filtroEstado !== 'TODOS'
            ? 'No se encontraron equipos con los filtros aplicados.'
            : 'No hay equipos registrados.';
        return;
    }

    tabla.style.display = 'table';
    mensajeVacio.style.display = 'none';

    // Crear filas dinámicamente
    equiposFiltrados.forEach(equipo => {
        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td>${equipo.ID}</td>
            <td>${equipo.NOMBRE}</td>
            <td>${equipo.TIPO}</td>
            <td><code>${equipo.SERIAL}</code></td>
            <td>${crearBadgeEstado(equipo.ESTADO)}</td>
            <td>${equipo.OBSERVACION || '—'}</td>
            <td class="acciones-celda"></td>
        `;

        // Crear botones de acción
        const celdaAcciones = fila.querySelector('.acciones-celda');

        // Botón Editar
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn--primario btn--pequeno';
        btnEditar.textContent = '✏️ Editar';
        btnEditar.addEventListener('click', () => onEditar(equipo));
        celdaAcciones.appendChild(btnEditar);

        // Botón Eliminar (deshabilitado si está PRESTADO)
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn--peligro btn--pequeno';
        btnEliminar.textContent = '🗑️ Eliminar';
        if (equipo.ESTADO === 'PRESTADO') {
            btnEliminar.disabled = true;
            btnEliminar.title = 'No se puede eliminar un equipo prestado';
        }
        btnEliminar.addEventListener('click', () => onEliminar(equipo));
        celdaAcciones.appendChild(btnEliminar);

        cuerpo.appendChild(fila);
    });
}

// ============================================================
// TABLA DE PRÉSTAMOS
// ============================================================

/**
 * Renderizar la tabla de préstamos ACTIVOS.
 * @param {Array} prestamos - Lista completa de préstamos.
 * @param {Function} onDevolver - Callback cuando se hace clic en devolver.
 */
export function renderizarPrestamosActivos(prestamos, onDevolver) {
    const cuerpo = document.getElementById('cuerpo-tabla-prestamos-activos');
    const mensajeVacio = document.getElementById('prestamos-activos-vacio');
    const tabla = document.getElementById('tabla-prestamos-activos');

    // Filtrar solo ACTIVOS
    const activos = prestamos.filter(p => p.ESTADO === 'ACTIVO');

    // Limpiar tabla
    cuerpo.innerHTML = '';

    if (activos.length === 0) {
        tabla.style.display = 'none';
        mensajeVacio.style.display = 'block';
        mensajeVacio.textContent = 'No hay préstamos activos.';
        return;
    }

    tabla.style.display = 'table';
    mensajeVacio.style.display = 'none';

    activos.forEach(prestamo => {
        const fila = document.createElement('tr');

        // Determinar si el préstamo está vencido
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaDevolucion = new Date(prestamo.FECHA_DEVOLUCION_PREVISTA);
        const estaVencido = fechaDevolucion < hoy;

        // Badge de estado: VENCIDO si la fecha ya pasó, ACTIVO si no
        const badgeEstado = estaVencido
            ? '<span class="badge badge--vencido">VENCIDO</span>'
            : crearBadgeEstado('ACTIVO');

        fila.innerHTML = `
            <td>${prestamo.ID}</td>
            <td>${prestamo.EQUIPO_NOMBRE}</td>
            <td>${prestamo.RESPONSABLE}</td>
            <td>${prestamo.IDENTIFICACION}</td>
            <td>${formatearFecha(prestamo.FECHA_PRESTAMO)}</td>
            <td>${formatearFecha(prestamo.FECHA_DEVOLUCION_PREVISTA)}</td>
            <td>${badgeEstado}</td>
            <td class="acciones-celda"></td>
        `;

        // Botón Devolver
        const celdaAcciones = fila.querySelector('.acciones-celda');
        const btnDevolver = document.createElement('button');
        btnDevolver.className = 'btn btn--exito btn--pequeno';
        btnDevolver.textContent = '↩️ Devolver';
        btnDevolver.addEventListener('click', () => onDevolver(prestamo));
        celdaAcciones.appendChild(btnDevolver);

        cuerpo.appendChild(fila);
    });
}

/**
 * Renderizar la tabla del historial de préstamos DEVUELTOS.
 * @param {Array} prestamos - Lista completa de préstamos.
 * @param {Function} onEliminar - Callback cuando se hace clic en eliminar un devuelto.
 */
export function renderizarHistorialPrestamos(prestamos, onEliminar) {
    const cuerpo = document.getElementById('cuerpo-tabla-prestamos-devueltos');
    const mensajeVacio = document.getElementById('prestamos-devueltos-vacio');
    const tabla = document.getElementById('tabla-prestamos-devueltos');
    const btnEliminarTodos = document.getElementById('btn-eliminar-todos-devueltos');

    // Filtrar solo DEVUELTOS
    const devueltos = prestamos.filter(p => p.ESTADO === 'DEVUELTO');

    // Limpiar tabla
    cuerpo.innerHTML = '';

    if (devueltos.length === 0) {
        tabla.style.display = 'none';
        mensajeVacio.style.display = 'block';
        mensajeVacio.textContent = 'No hay préstamos devueltos en el historial.';
        btnEliminarTodos.disabled = true;
        return;
    }

    tabla.style.display = 'table';
    mensajeVacio.style.display = 'none';
    btnEliminarTodos.disabled = false;

    devueltos.forEach(prestamo => {
        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td>${prestamo.ID}</td>
            <td>${prestamo.EQUIPO_NOMBRE}</td>
            <td>${prestamo.RESPONSABLE}</td>
            <td>${prestamo.IDENTIFICACION}</td>
            <td>${formatearFecha(prestamo.FECHA_PRESTAMO)}</td>
            <td>${formatearFecha(prestamo.FECHA_DEVOLUCION_PREVISTA)}</td>
            <td>${crearBadgeEstado('DEVUELTO')}</td>
            <td class="acciones-celda"></td>
        `;

        // Botón Eliminar
        const celdaAcciones = fila.querySelector('.acciones-celda');
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn--peligro btn--pequeno';
        btnEliminar.textContent = '🗑️ Eliminar';
        btnEliminar.addEventListener('click', () => onEliminar(prestamo));
        celdaAcciones.appendChild(btnEliminar);

        cuerpo.appendChild(fila);
    });
}

// ============================================================
// SELECTOR DE EQUIPOS DISPONIBLES
// ============================================================

/**
 * Llenar el selector de equipos disponibles para préstamos.
 * Solo muestra equipos con estado DISPONIBLE.
 * @param {Array} equipos - Lista de todos los equipos.
 */
export function llenarSelectorEquipos(equipos) {
    const selector = document.getElementById('prestamo-equipo');
    // Mantener la opción por defecto
    selector.innerHTML = '<option value="">-- Seleccionar equipo --</option>';

    const disponibles = equipos.filter(e => e.ESTADO === 'DISPONIBLE');

    disponibles.forEach(equipo => {
        const opcion = document.createElement('option');
        opcion.value = equipo.ID;
        opcion.textContent = `${equipo.NOMBRE} (${equipo.SERIAL})`;
        selector.appendChild(opcion);
    });

    // Deshabilitar si no hay equipos disponibles
    if (disponibles.length === 0) {
        const opcion = document.createElement('option');
        opcion.value = '';
        opcion.textContent = 'No hay equipos disponibles';
        opcion.disabled = true;
        selector.appendChild(opcion);
    }
}

// ============================================================
// FORMULARIO DE EQUIPOS (editar / limpiar)
// ============================================================

/**
 * Llenar el formulario de equipos con datos para edición.
 * @param {Object} equipo - Datos del equipo a editar.
 */
export function llenarFormularioEquipo(equipo) {
    document.getElementById('equipo-id').value = equipo.ID;
    document.getElementById('equipo-nombre').value = equipo.NOMBRE;
    document.getElementById('equipo-tipo').value = equipo.TIPO;
    document.getElementById('equipo-serial').value = equipo.SERIAL;
    document.getElementById('equipo-estado').value = equipo.ESTADO;
    document.getElementById('equipo-observacion').value = equipo.OBSERVACION || '';
    document.getElementById('titulo-form-equipo').textContent = 'Editar Equipo';
    document.getElementById('btn-guardar-equipo').textContent = '💾 Actualizar Equipo';
    document.getElementById('btn-cancelar-equipo').style.display = 'inline-flex';

    // Scroll al formulario
    document.getElementById('form-equipo').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Limpiar el formulario de equipos (volver a modo registro).
 */
export function limpiarFormularioEquipo() {
    document.getElementById('equipo-id').value = '';
    document.getElementById('equipo-nombre').value = '';
    document.getElementById('equipo-tipo').value = '';
    document.getElementById('equipo-serial').value = '';
    document.getElementById('equipo-estado').value = 'DISPONIBLE';
    document.getElementById('equipo-observacion').value = '';
    document.getElementById('titulo-form-equipo').textContent = 'Registrar Nuevo Equipo';
    document.getElementById('btn-guardar-equipo').textContent = '💾 Guardar Equipo';
    document.getElementById('btn-cancelar-equipo').style.display = 'none';
}

/**
 * Limpiar el formulario de préstamos.
 */
export function limpiarFormularioPrestamo() {
    document.getElementById('prestamo-equipo').value = '';
    document.getElementById('prestamo-responsable').value = '';
    document.getElementById('prestamo-identificacion').value = '';
    document.getElementById('prestamo-fecha').value = '';
    document.getElementById('prestamo-fecha-devolucion').value = '';
}

// ============================================================
// MENSAJES TOAST
// ============================================================

/**
 * Mostrar un mensaje toast temporal.
 * @param {string} mensaje - Texto del mensaje.
 * @param {string} tipo - Tipo: 'exito' o 'error'.
 */
export function mostrarToast(mensaje, tipo = 'exito') {
    const contenedor = document.getElementById('toast-contenedor');
    const toast = document.createElement('div');
    toast.className = `toast toast--${tipo}`;
    toast.textContent = mensaje;
    contenedor.appendChild(toast);

    // Eliminar después de la animación (4 segundos)
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 4000);
}

// ============================================================
// MODAL DE CONFIRMACIÓN
// ============================================================

/**
 * Mostrar modal de confirmación y retornar una promesa.
 * @param {string} mensaje - Mensaje a mostrar.
 * @returns {Promise<boolean>} true si confirma, false si cancela.
 */
export function confirmar(mensaje) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirmar');
        const textoMensaje = document.getElementById('modal-mensaje');
        const btnConfirmar = document.getElementById('modal-btn-confirmar');
        const btnCancelar = document.getElementById('modal-btn-cancelar');

        textoMensaje.textContent = mensaje;
        modal.style.display = 'flex';

        // Limpiar listeners anteriores clonando botones
        const nuevoConfirmar = btnConfirmar.cloneNode(true);
        const nuevoCancelar = btnCancelar.cloneNode(true);
        btnConfirmar.replaceWith(nuevoConfirmar);
        btnCancelar.replaceWith(nuevoCancelar);

        nuevoConfirmar.addEventListener('click', () => {
            modal.style.display = 'none';
            resolve(true);
        });

        nuevoCancelar.addEventListener('click', () => {
            modal.style.display = 'none';
            resolve(false);
        });
    });
}

// ============================================================
// NAVEGACIÓN ENTRE SECCIONES
// ============================================================

/**
 * Cambiar la sección visible.
 * @param {string} seccionId - ID de la sección a mostrar (panel, equipos, prestamos).
 */
export function cambiarSeccion(seccionId) {
    // Ocultar todas las secciones
    const secciones = document.querySelectorAll('.seccion');
    secciones.forEach(s => s.classList.remove('seccion--activa'));

    // Mostrar la sección seleccionada
    const seccionActiva = document.getElementById(`seccion-${seccionId}`);
    if (seccionActiva) {
        seccionActiva.classList.add('seccion--activa');
    }

    // Actualizar botones de navegación
    const botones = document.querySelectorAll('.nav__btn');
    botones.forEach(btn => {
        btn.classList.remove('nav__btn--activo');
        if (btn.dataset.seccion === seccionId) {
            btn.classList.add('nav__btn--activo');
        }
    });
}

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Crear HTML de badge de estado.
 * @param {string} estado - DISPONIBLE, PRESTADO, MANTENIMIENTO, ACTIVO, DEVUELTO.
 * @returns {string} HTML del badge.
 */
function crearBadgeEstado(estado) {
    const clases = {
        'DISPONIBLE': 'badge--disponible',
        'PRESTADO': 'badge--prestado',
        'MANTENIMIENTO': 'badge--mantenimiento',
        'ACTIVO': 'badge--activo',
        'DEVUELTO': 'badge--devuelto'
    };
    const clase = clases[estado] || '';
    return `<span class="badge ${clase}">${estado}</span>`;
}

/**
 * Formatear una fecha ISO a formato legible dd/mm/aaaa.
 * @param {string} fechaISO - Fecha en formato ISO.
 * @returns {string} Fecha formateada.
 */
function formatearFecha(fechaISO) {
    if (!fechaISO) return '—';
    const fecha = new Date(fechaISO);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

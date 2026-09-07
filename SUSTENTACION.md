# 🎓 Guía de Sustentación — Sistema de Préstamo de Equipos

Esta guía te ayuda a explicar el sistema con palabras sencillas durante tu sustentación.

---

## 🔄 Recorrido Completo de una Petición

Cuando el usuario interactúa con la aplicación, este es el camino que sigue la información:

```
Usuario (navegador)
  → evento JavaScript (click / submit)
    → fetch() (petición HTTP)
      → API REST (Express recibe)
        → Route (dirige al controlador correcto)
          → Controller (valida datos y reglas)
            → Data (ejecuta SQL en Oracle)
              → Oracle Database (modifica tablas)
            ← respuesta de Oracle
          ← respuesta del controller
        ← respuesta JSON
      ← fetch recibe la respuesta
    ← se procesa el resultado
  → actualización del DOM (la interfaz cambia)
```

---

## 📖 Ejemplo Completo: "Registrar un Préstamo"

### Paso 1 — El usuario interactúa (frontend)

**Archivo:** `frontend/js/app.js`

El usuario llena el formulario de préstamo y hace clic en "Registrar Préstamo".

```javascript
// app.js registra el evento submit del formulario
const formPrestamo = document.getElementById('form-prestamo');
formPrestamo.addEventListener('submit', manejarSubmitPrestamo);
```

La función `manejarSubmitPrestamo` se ejecuta:
1. Lee los valores del formulario con `document.getElementById()`.
2. Valida que no estén vacíos.
3. Crea un objeto con los datos.

### Paso 2 — Se envía la petición (fetch)

**Archivo:** `frontend/js/api.js`

```javascript
export async function crearPrestamo(prestamo) {
    const respuesta = await fetch('http://localhost:3000/api/prestamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prestamo)
    });
    const datos = await respuesta.json();
    return datos;
}
```

- `fetch()` envía una petición **POST** al backend.
- El cuerpo contiene un objeto **JSON** con los datos del préstamo.
- `await` espera la respuesta del servidor.

### Paso 3 — La ruta recibe la petición

**Archivo:** `backend/routes/prestamosRoutes.js`

```javascript
router.post('/', prestamosController.crear);
```

Express recibe `POST /api/prestamos` y llama al **controller**.

### Paso 4 — El controller valida

**Archivo:** `backend/controllers/prestamosController.js`

El controller hace estas validaciones en orden:
1. ¿Los campos obligatorios están llenos?
2. ¿Las fechas son válidas?
3. ¿La fecha de devolución no es anterior al préstamo?
4. ¿El equipo existe?
5. ¿El equipo está DISPONIBLE? (no PRESTADO ni en MANTENIMIENTO)

Si algo falla, retorna un error 400 con un mensaje claro.

### Paso 5 — La capa data ejecuta SQL

**Archivo:** `backend/data/prestamosData.js`

```javascript
// TRANSACCIÓN: dos operaciones que deben ser atómicas
// 1. Insertar el préstamo
await conexion.execute(
    `INSERT INTO PRESTAMOS (...) VALUES (:equipo_id, :responsable, ...)`,
    { equipo_id, responsable, ... },
    { autoCommit: false }
);

// 2. Cambiar estado del equipo
await conexion.execute(
    `UPDATE EQUIPOS SET ESTADO = 'PRESTADO' WHERE ID = :equipo_id`,
    { equipo_id },
    { autoCommit: false }
);

// Si ambas operaciones son correctas → COMMIT
await conexion.commit();
```

- Usa **bind variables** (`:equipo_id`) en lugar de concatenar valores.
- Usa **transacción**: si la segunda operación falla, hace **ROLLBACK** y deshace la primera.

### Paso 6 — Oracle cambia

En la base de datos Oracle:
- Tabla `PRESTAMOS`: se inserta una nueva fila con estado `ACTIVO`.
- Tabla `EQUIPOS`: el equipo cambia de `DISPONIBLE` a `PRESTADO`.

### Paso 7 — El backend responde JSON

```json
{
    "ok": true,
    "mensaje": "Préstamo registrado exitosamente.",
    "datos": {
        "ID": 4,
        "EQUIPO_ID": 2,
        "EQUIPO_NOMBRE": "Proyector Epson PowerLite",
        "RESPONSABLE": "Ana López",
        "ESTADO": "ACTIVO"
    }
}
```

### Paso 8 — La interfaz se actualiza

**Archivo:** `frontend/js/app.js`

```javascript
if (respuesta.ok) {
    mostrarToast(respuesta.mensaje, 'exito');   // Muestra mensaje verde
    limpiarFormularioPrestamo();                  // Limpia el formulario
    await cargarTodo();                           // Recarga datos de la API
}
```

**Archivo:** `frontend/js/interfaz.js`

`cargarTodo()` llama a la API de nuevo, obtiene los datos actualizados, y:
- Actualiza la tabla de préstamos (nuevo préstamo aparece).
- Actualiza las tarjetas del panel (números cambian).
- Actualiza el selector de equipos (el equipo prestado ya no aparece como disponible).

---

## ❓ Preguntas que Podría Hacer el Profesor

### ¿Qué es una API REST?

Es una forma de comunicar el frontend y el backend usando **peticiones HTTP** (GET, POST, PUT, DELETE) y **respuestas JSON**. REST significa que cada URL representa un recurso (por ejemplo, `/api/equipos` representa los equipos) y usamos los métodos HTTP para indicar qué queremos hacer con ese recurso.

### ¿Qué hace fetch()?

`fetch()` es una función de JavaScript que envía peticiones HTTP al servidor. La usamos en el frontend para comunicarnos con la API del backend. Envía datos como JSON y recibe las respuestas del servidor.

### ¿Qué diferencia hay entre route y controller?

La **route** define la URL y el método HTTP (ejemplo: `POST /api/equipos`). Solo decide *a quién* enviar la petición. El **controller** es quien *realmente hace el trabajo*: valida los datos, aplica las reglas de negocio y llama a la capa data.

### ¿Qué hace la capa data?

La capa data contiene las funciones que ejecutan las consultas SQL contra la base de datos Oracle. Separa la lógica de acceso a datos del resto del código. Usa **bind variables** para prevenir inyección SQL.

### ¿Por qué usamos Oracle?

Porque es un sistema de gestión de bases de datos relacional robusto, ampliamente usado en entornos empresariales. Garantiza integridad de datos con constraints (PRIMARY KEY, FOREIGN KEY, CHECK, UNIQUE) y soporta transacciones ACID.

### ¿Qué es JSON?

JSON (JavaScript Object Notation) es un formato de texto para intercambiar datos. Se ve como un objeto JavaScript:
```json
{ "nombre": "Laptop Dell", "estado": "DISPONIBLE" }
```
Lo usamos para enviar y recibir datos entre el frontend y el backend.

### ¿Qué significa GET?

Es un método HTTP para **consultar** información. No modifica datos. Ejemplo: `GET /api/equipos` trae la lista de todos los equipos.

### ¿Qué significa POST?

Es un método HTTP para **crear** un nuevo recurso. Ejemplo: `POST /api/equipos` crea un nuevo equipo con los datos que se envían en el cuerpo de la petición.

### ¿Qué significa PUT?

Es un método HTTP para **actualizar** un recurso existente. Ejemplo: `PUT /api/equipos/1` actualiza el equipo con ID 1.

### ¿Qué significa DELETE?

Es un método HTTP para **eliminar** un recurso. Ejemplo: `DELETE /api/equipos/1` elimina el equipo con ID 1.

### ¿Qué es un código 400?

Significa **Bad Request** (petición incorrecta). Se retorna cuando los datos enviados no son válidos o violan una regla de negocio. Ejemplo: intentar prestar un equipo que ya está prestado.

### ¿Qué es un código 404?

Significa **Not Found** (no encontrado). Se retorna cuando el recurso solicitado no existe. Ejemplo: consultar un equipo con un ID que no existe en la base de datos.

### ¿Qué es un código 500?

Significa **Internal Server Error** (error interno). Se retorna cuando ocurre un error inesperado en el servidor, como una falla en la conexión a Oracle.

### ¿Por qué utilizamos bind variables?

Para **prevenir inyección SQL**. En lugar de concatenar valores del usuario directamente en la consulta SQL, usamos marcadores (`:nombre`, `:id`) y pasamos los valores como parámetros. Oracle los trata como datos puros, nunca como código SQL.

```javascript
// ✅ CORRECTO: bind variable
await conexion.execute('SELECT * FROM EQUIPOS WHERE ID = :id', { id: 5 });

// ❌ INCORRECTO: concatenación (vulnerable a inyección SQL)
await conexion.execute('SELECT * FROM EQUIPOS WHERE ID = ' + id);
```

### ¿Qué hace async/await?

`async/await` permite escribir código **asíncrono** de forma legible. Cuando hacemos una operación que toma tiempo (como consultar Oracle o hacer un fetch), `await` **espera** el resultado antes de continuar, sin bloquear el resto de la aplicación. La función que usa `await` debe marcarse como `async`.

### ¿Qué hace addEventListener?

`addEventListener` registra una función que se ejecutará cuando ocurra un evento específico en un elemento HTML. Por ejemplo:
```javascript
boton.addEventListener('click', miFuncion);
```
Cuando el usuario haga clic en el botón, se ejecuta `miFuncion`.

### ¿Qué es el DOM?

El DOM (Document Object Model) es la representación en memoria de la página HTML. JavaScript puede acceder y modificar el DOM para cambiar lo que el usuario ve. Usamos funciones como `document.getElementById()`, `createElement()`, `innerHTML`, etc.

### ¿Por qué usamos import/export?

Para **organizar el código en módulos**. Cada archivo tiene una responsabilidad específica:
- `api.js` exporta funciones para comunicarse con el servidor.
- `interfaz.js` exporta funciones para manipular el DOM.
- `app.js` importa lo que necesita de cada módulo.

Esto hace el código más organizado, reutilizable y fácil de mantener.

### ¿Cómo se evita prestar dos veces el mismo equipo?

De **tres maneras** que se complementan:
1. **Base de datos**: El equipo tiene estado PRESTADO, y la constraint CHECK solo permite DISPONIBLE, PRESTADO o MANTENIMIENTO.
2. **Controller**: Antes de crear el préstamo, verifica que el equipo esté DISPONIBLE. Si está PRESTADO, retorna error 400.
3. **Frontend**: El selector solo muestra equipos DISPONIBLES, así que el usuario ni siquiera puede seleccionar uno prestado.

### ¿Qué ocurre en la base cuando se registra una devolución?

Dos cambios dentro de una **transacción**:
1. En la tabla `PRESTAMOS`: el estado del préstamo cambia de `ACTIVO` a `DEVUELTO`.
2. En la tabla `EQUIPOS`: el estado del equipo cambia de `PRESTADO` a `DISPONIBLE`.

Si cualquiera de los dos cambios falla, se ejecuta **ROLLBACK** y ninguno se aplica. Esto garantiza consistencia.

### ¿Por qué la ruta /devueltos va ANTES de /:id en Express?

En `prestamosRoutes.js`, el orden de declaración de rutas es fundamental:
```javascript
router.delete('/devueltos', prestamosController.eliminarTodosDevueltos);
router.delete('/:id', prestamosController.eliminar);
```
Express evalúa las rutas secuencialmente. Si `/api/prestamos/:id` estuviera antes, una petición a `/api/prestamos/devueltos` coincidiría con el parámetro dinámico `:id`, interpretando la palabra `"devueltos"` como un ID numérico, lo que causaría un error 400 (`NaN`). Al colocar `/devueltos` primero, Express resuelve la ruta exacta antes del comodín `:id`.

### ¿Cómo se protege un préstamo ACTIVO para que nunca sea eliminado?

Se protege en dos capas independientes:
1. **Capa Controller (`prestamosController.js`)**: Antes de cualquier eliminación, consulta el estado del registro. Si `prestamo.ESTADO === 'ACTIVO'`, detiene el flujo inmediatamente y retorna `400 Bad Request` con el mensaje `"No se puede eliminar un préstamo activo."`
2. **Capa Data (`prestamosData.js`)**: Las consultas SQL de eliminación incluyen la cláusula de seguridad:
   - Individual: `DELETE FROM PRESTAMOS WHERE ID = :id AND ESTADO = 'DEVUELTO'`
   - Masivo: `DELETE FROM PRESTAMOS WHERE ESTADO = 'DEVUELTO'`
   Esto garantiza que, incluso si ocurriese una falla lógica externa, la base de datos jamás tocará un registro activo.

### ¿Cómo interactúa el frontend al devolver o eliminar un préstamo?

Al completar exitosamente una devolución o eliminación:
1. El backend responde `200 OK`.
2. El frontend ejecuta `cargarTodo()`.
3. Se consultan nuevamente los endpoints `/api/prestamos` y `/api/equipos`.
4. Se ejecutan:
   - `renderizarPrestamosActivos()`: El préstamo devuelto desaparece de la tabla activa.
   - `renderizarHistorialPrestamos()`: El préstamo devuelto aparece en el historial (o desaparece si fue eliminado).
   - `actualizarTarjetas()`: Las tarjetas de conteo en el Panel Principal se actualizan de inmediato.
   - `llenarSelectorEquipos()`: El equipo devuelto vuelve a estar disponible para nuevos préstamos.

---

## 🔧 Cambios Sencillos que el Profesor Podría Pedirme en Vivo

### 1. Agregar un filtro (ej: filtrar préstamos activos por responsable)

**Dónde modificar:**
- `frontend/index.html` → Agregar un campo de texto para filtrar.
- `frontend/js/interfaz.js` → En `renderizarPrestamosActivos()`, agregar un `.filter()` por el campo responsable.
- `frontend/js/app.js` → Agregar un `addEventListener('input')` en el nuevo campo y llamar a la función de filtrado.

### 2. Agregar una validación (ej: identificación debe tener mínimo 8 caracteres)

**Dónde modificar:**
- `backend/controllers/prestamosController.js` → Agregar un `if` después de validar que no esté vacío:
```javascript
if (identificacion.trim().length < 8) {
    return res.status(400).json({ ok: false, mensaje: 'La identificación debe tener mínimo 8 caracteres.' });
}
```
- Opcionalmente en `frontend/js/app.js` → En `manejarSubmitPrestamo()`, agregar la misma validación antes del fetch.

### 3. Impedir préstamos bajo una nueva condición (ej: máximo 3 préstamos activos por persona)

**Dónde modificar:**
- `backend/controllers/prestamosController.js` → Antes de crear el préstamo:
  1. Consultar cuántos préstamos ACTIVOS tiene esa persona.
  2. Si ya tiene 3 o más, retornar error 400.
- `backend/data/prestamosData.js` → Agregar una función `contarActivosPorIdentificacion(identificacion)` que haga un `SELECT COUNT(*)`.

### 4. Cambiar un texto (ej: cambiar "Préstamo de Equipos" por "Gestión de Laboratorio")

**Dónde modificar:**
- `frontend/index.html` → Cambiar el texto en el `<h1>` del header.
- También en el `<title>` del `<head>`.

### 5. Agregar un campo visual (ej: mostrar la fecha actual del préstamo en la tabla)

**Dónde modificar:**
- `frontend/index.html` → Agregar un `<th>` en la cabecera de la tabla correspondiente.
- `frontend/js/interfaz.js` → En la función `renderizarTabla...()`, agregar un `<td>` con el dato correspondiente.

### 6. Explicar por qué una petición retorna 400 o 404

**Cómo explicarlo:**
1. Abrir `backend/controllers/equiposController.js` o `prestamosController.js`.
2. Buscar los bloques `if` que retornan `res.status(400)` o `res.status(404)`.
3. Explicar qué condición se evaluó y por qué el dato enviado la incumplió.
4. Mostrar el mensaje JSON que se retorna al cliente.

**Ejemplo de explicación:**
> "Cuando intento prestar el equipo 6, el controller primero consulta el equipo en la base de datos. Encuentra que su estado es MANTENIMIENTO. Como la regla dice que solo equipos DISPONIBLES pueden prestarse, retorna un 400 con el mensaje 'El equipo se encuentra en mantenimiento y no puede ser prestado.'"

---

## 💡 Consejos para la Sustentación

1. **Domina el flujo completo**: practica explicar el recorrido de una petición de principio a fin.
2. **Ten el código abierto**: muestra los archivos relevantes mientras explicas.
3. **Haz demos en vivo**: registra un equipo, préstalo, devuélvelo. Muestra los errores.
4. **Usa Postman**: demuestra las pruebas inválidas (400, 404).
5. **Abre la consola del navegador** (F12 → Network): muestra las peticiones HTTP en tiempo real.
6. **No memorices**: entiende por qué cada parte existe y qué problema resuelve.

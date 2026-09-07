# 🖥️ Sistema Web para Préstamo de Equipos Tecnológicos

Sistema web para administrar equipos tecnológicos de un laboratorio universitario y controlar sus préstamos y devoluciones.

---

## 📋 Descripción

Aplicación web que permite:
- Registrar, consultar, editar y eliminar equipos tecnológicos.
- Controlar préstamos y devoluciones con reglas de negocio.
- Visualizar un panel con métricas del estado del laboratorio.
- Conocer qué equipos están disponibles, prestados o en mantenimiento.
- Saber quién tiene cada equipo y cuándo debe devolverlo.

---

## 🛠️ Tecnologías Utilizadas

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, JavaScript (ES Modules) |
| Backend | Node.js, Express.js |
| Base de Datos | Oracle Database XE 21c |
| Comunicación | API REST con JSON |
| Pruebas | Postman |

### Dependencias npm
- `express` — Framework HTTP para la API REST
- `oracledb` — Driver oficial de Oracle para Node.js
- `cors` — Habilitar peticiones desde el frontend
- `dotenv` — Variables de entorno desde archivo `.env`

---

## 📁 Arquitectura de Carpetas

```
PrestamoEquipos/
├── backend/
│   ├── config/
│   │   └── database.js          ← Pool de conexiones Oracle
│   ├── controllers/
│   │   ├── equiposController.js  ← Validaciones y lógica de negocio
│   │   └── prestamosController.js
│   ├── data/
│   │   ├── equiposData.js        ← Consultas SQL parametrizadas
│   │   └── prestamosData.js
│   ├── routes/
│   │   ├── equiposRoutes.js      ← Definición de endpoints
│   │   └── prestamosRoutes.js
│   ├── app.js                    ← Configuración Express
│   ├── server.js                 ← Punto de entrada
│   └── package.json
├── frontend/
│   ├── index.html                ← Interfaz principal
│   ├── css/
│   │   └── styles.css            ← Estilos CSS propios
│   └── js/
│       ├── app.js                ← Coordinador de eventos
│       ├── api.js                ← Funciones fetch()
│       └── interfaz.js           ← Manipulación del DOM
├── database/
│   └── script.sql                ← DDL y datos iniciales
├── postman/
│   └── PrestamoEquipos.postman_collection.json
├── .gitignore
├── .env.example
├── README.md
└── SUSTENTACION.md
```

### Separación de responsabilidades en el backend

```
Petición HTTP → Route → Controller → Data → Oracle
                  ↓         ↓           ↓
             Define URL  Valida     Ejecuta SQL
                        reglas     con bind vars
```

---

## ✅ Requisitos Previos

1. **Node.js** v18 o superior → [nodejs.org](https://nodejs.org)
2. **Oracle Database XE 21c** instalado y corriendo
3. **Oracle Instant Client** (si es necesario para oracledb)
4. **Postman** (opcional, para pruebas de API)

---

## ⚙️ Configuración de Oracle

### 1. Verificar que Oracle está corriendo

Abre una terminal como administrador y ejecuta:

```bash
lsnrctl status
```

Deberías ver el servicio `XEPDB1` en la lista.

### 2. Crear el usuario de la aplicación (si no existe)

Conéctate como SYSDBA:

```sql
sqlplus sys/TU_PASSWORD_DE_SYS@localhost:1521/XEPDB1 as sysdba
```

Crea el usuario:

```sql
CREATE USER PRESTAMOS_APP IDENTIFIED BY TU_CONTRASEÑA_AQUI;
GRANT CONNECT, RESOURCE TO PRESTAMOS_APP;
ALTER USER PRESTAMOS_APP QUOTA UNLIMITED ON USERS;
```

### 3. Ejecutar el script de base de datos

```bash
sqlplus PRESTAMOS_APP/TU_CONTRASEÑA@localhost:1521/XEPDB1 @database/script.sql
```

O abre `database/script.sql` en SQL Developer y ejecútalo conectado como `PRESTAMOS_APP`.

El script:
- Elimina tablas/secuencias si existen (para re-ejecución)
- Crea tablas EQUIPOS y PRESTAMOS con constraints
- Crea secuencias y triggers para IDs automáticos
- Inserta datos de ejemplo

---

## 🚀 Cómo Ejecutar el Proyecto

### 1. Crear archivo `.env`

Copia `.env.example` y agrega tu contraseña:

```bash
copy .env.example .env
```

Edita `.env`:

```
DB_USER=PRESTAMOS_APP
DB_PASSWORD=TU_CONTRASEÑA_REAL_AQUI
DB_CONNECT_STRING=localhost:1521/XEPDB1
PORT=3000
```

### 2. Instalar dependencias

```bash
cd backend
npm install
```

### 3. Iniciar el backend

```bash
cd backend
npm start
```

Deberías ver:
```
✅ Pool de conexiones Oracle creado exitosamente.
🚀 Servidor corriendo en http://localhost:3000
```

### 4. Abrir el frontend

Abre `frontend/index.html` directamente en el navegador:
- Doble clic en el archivo, o
- Usa la extensión Live Server de VS Code

> **Nota:** El frontend se conecta a `http://localhost:3000/api` por defecto.

---

## 🌐 Endpoints de la API

### Equipos

| Método | Ruta | Descripción | Código |
|--------|------|-------------|--------|
| GET | `/api/equipos` | Listar todos los equipos | 200 |
| GET | `/api/equipos/:id` | Obtener equipo por ID | 200 / 404 |
| POST | `/api/equipos` | Crear equipo | 201 / 400 |
| PUT | `/api/equipos/:id` | Actualizar equipo | 200 / 400 / 404 |
| DELETE | `/api/equipos/:id` | Eliminar equipo | 200 / 400 / 404 |

### Préstamos

| Método | Ruta | Descripción | Código |
|--------|------|-------------|--------|
| GET | `/api/prestamos` | Listar todos los préstamos | 200 |
| POST | `/api/prestamos` | Crear préstamo | 201 / 400 / 404 |
| PUT | `/api/prestamos/:id/devolver` | Registrar devolución | 200 / 400 / 404 |
| DELETE | `/api/prestamos/devueltos` | Eliminar todos los préstamos devueltos | 200 |
| DELETE | `/api/prestamos/:id` | Eliminar préstamo devuelto individual | 200 / 400 / 404 |

### Formato de respuesta JSON

```json
{
    "ok": true,
    "mensaje": "Descripción de la operación",
    "datos": { ... }
}
```

---

## 📏 Reglas de Negocio

1. Un equipo solo puede prestarse si está **DISPONIBLE**.
2. Al registrar un préstamo: equipo cambia de DISPONIBLE → PRESTADO.
3. Al registrar una devolución: préstamo ACTIVO → DEVUELTO, equipo PRESTADO → DISPONIBLE.
4. Un equipo en **MANTENIMIENTO** no puede prestarse.
5. Un equipo **PRESTADO** no puede prestarse otra vez.
6. La fecha de devolución prevista no puede ser anterior a la fecha de préstamo.
7. Los campos obligatorios no pueden estar vacíos.
8. El serial del equipo debe ser único.
9. Las operaciones inválidas retornan mensajes JSON claros.
10. No se puede devolver dos veces el mismo préstamo.
11. Préstamo y devolución usan **transacciones Oracle** (commit/rollback).
12. Solo se pueden eliminar préstamos con estado **DEVUELTO** del historial.
13. Un préstamo **ACTIVO** nunca puede eliminarse (retorna código 400 y mensaje de error).
14. La eliminación masiva limpia únicamente los préstamos **DEVUELTOS**, preservando los activos y reportando el conteo de registros eliminados.

---

## 🧪 Pruebas con Postman

1. Abre Postman.
2. Importa `postman/PrestamoEquipos.postman_collection.json`.
3. La variable `{{baseUrl}}` ya está configurada como `http://localhost:3000`.
4. Ejecuta las pruebas en orden numérico.

### Pruebas incluidas

| # | Prueba | Resultado esperado |
|---|--------|--------------------|
| 01 | GET todos los equipos | 200 + lista |
| 02 | GET equipo por ID | 200 + equipo |
| 03 | POST nuevo equipo | 201 + creado |
| 04 | PUT actualizar equipo | 200 + actualizado |
| 05 | DELETE eliminar equipo | 200 |
| 06 | GET todos los préstamos | 200 + lista |
| 07 | POST nuevo préstamo | 201 + creado |
| 08 | PUT registrar devolución | 200 + devuelto |
| 09 | ❌ Prestar equipo en mantenimiento | 400 |
| 10 | ❌ Prestar equipo ya prestado | 400 |
| 11 | ❌ Equipo inexistente | 404 |
| 12 | ❌ Campos vacíos | 400 |
| 13 | ❌ Fecha devolución anterior | 400 |
| 14 | DELETE préstamo devuelto individual | 200 + eliminado |
| 15 | DELETE todos los devueltos | 200 + cantidad |
| 16 | ❌ Eliminar préstamo ACTIVO | 400 |

---

## ✨ Funcionalidades Adicionales

1. **Búsqueda de equipos** por nombre o serial.
2. **Filtro de equipos** por estado (Todos, Disponible, Prestado, Mantenimiento).
3. **Separación visual de préstamos**: sección independiente para **Préstamos Activos** y sección dedicada para **Historial de Préstamos Devueltos**.
4. **Gestión del Historial**: eliminación individual y masiva de préstamos devueltos con confirmación interactiva, protegiendo siempre los activos.
5. **Etiqueta VENCIDO** en préstamos activos cuya fecha prevista ya pasó.

---

## 🔄 Recorrido Completo de una Petición

Ejemplo: **Registrar un préstamo**

```
1. Usuario llena formulario y hace clic en "Registrar Préstamo"
2. app.js captura el evento submit → manejarSubmitPrestamo()
3. api.js envía fetch() POST a /api/prestamos con JSON
4. Express recibe la petición en prestamosRoutes.js
5. prestamosRoutes.js dirige al controller: prestamosController.crear()
6. El controller valida reglas de negocio
7. Llama a prestamosData.crear() que ejecuta SQL con bind variables
8. Oracle: INSERT en PRESTAMOS + UPDATE estado en EQUIPOS (transacción)
9. Si todo sale bien → COMMIT; si falla → ROLLBACK
10. El controller responde JSON { ok: true, mensaje, datos }
11. api.js recibe la respuesta y la retorna a app.js
12. app.js muestra un toast de éxito y recarga los datos
13. interfaz.js actualiza la tabla y las tarjetas del panel
```

---

## ❓ Problemas Comunes

### Error: "ORA-12541: TNS: no listener"
El listener de Oracle no está corriendo.
```bash
lsnrctl start
```

### Error: "ORA-01017: invalid username/password"
La contraseña en `.env` no coincide con la del usuario Oracle.

### Error: "NJS-500: connection to Oracle failed"
Verifica que:
1. Oracle esté corriendo: `lsnrctl status`
2. El servicio XEPDB1 esté disponible
3. `DB_CONNECT_STRING` en `.env` sea correcto

### Error: "CORS blocked"
El backend debe estar corriendo en `http://localhost:3000`.

### El frontend no carga datos
1. Verifica que el backend esté corriendo.
2. Abre la consola del navegador (F12) para ver errores.
3. Verifica que `frontend/js/api.js` tenga `BASE_URL = 'http://localhost:3000/api'`.

---

## 👤 Autor

Proyecto académico — Evaluación de Desarrollo Web.

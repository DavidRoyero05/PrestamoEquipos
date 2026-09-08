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

## 🐧 Ejecución alternativa en WSL2 + Ubuntu

Esta sección es opcional. El proyecto puede ejecutarse normalmente en Windows siguiendo las instrucciones anteriores. Los siguientes pasos están dirigidos a desarrolladores que prefieran utilizar WSL2 con Ubuntu.

### 1. Requisitos en WSL

Para ejecutar el entorno en WSL se necesita:

- Windows con **WSL2** habilitado.
- Una distribución **Ubuntu** instalada.
- **Git** instalado dentro de Ubuntu.
- **Node.js** (v18 o superior) y **npm** dentro de Ubuntu.
- Acceso a **Oracle Database**.

> **Nota sobre Oracle Database:**  
> La base de datos puede estar:
> - **A)** Instalada o accesible externamente (por ejemplo, en el sistema operativo Windows anfitrión o en un servidor remoto).
> - **B)** Ejecutándose mediante un contenedor Docker.
>
> *Docker no es obligatorio para el proyecto*; es simplemente una de las alternativas posibles para disponer de la base de datos.

### 2. Clonar el proyecto

Ejecuta en la terminal de Ubuntu:

```bash
git clone https://github.com/DavidRoyero05/PrestamoEquipos.git
cd PrestamoEquipos
```

> **Recomendación:** Es preferible clonar y trabajar dentro del propio filesystem de Ubuntu (por ejemplo en `~/proyectos/PrestamoEquipos`), en lugar de depender de rutas absolutas o montadas de Windows (como `C:\...`, `D:\...` o `/mnt/c/...`), para asegurar un rendimiento óptimo y evitar problemas con permisos de Linux.

### 3. Instalar dependencias

Ingresa a la carpeta del backend e instala las dependencias:

```bash
cd backend
npm install
```

> La carpeta `node_modules` no viene incluida en Git y debe generarse nuevamente en cada entorno mediante `npm install`.

### 4. Configurar .env en Linux

Desde la raíz del proyecto (`PrestamoEquipos/`), copia el archivo de plantilla:

```bash
cp .env.example .env
```

> Mientras que en Windows la documentación utiliza `copy .env.example .env`, en Linux/Ubuntu el comando correcto es `cp .env.example .env`.

Edita el archivo `.env` configurando los valores correspondientes:

```env
DB_USER=PRESTAMOS_APP
DB_PASSWORD=TU_CONTRASEÑA
DB_CONNECT_STRING=localhost:1521/XEPDB1
PORT=3000
```

Ten presente que:
- Cada desarrollador debe colocar su propia contraseña en `DB_PASSWORD`.
- El archivo `.env` contiene credenciales locales y **no debe subirse a Git** (se encuentra protegido en el `.gitignore`).
- El archivo `.env.example` sí permanece en el repositorio como guía.

### 5. Configuración de Oracle Database

El proyecto necesita Oracle Database independientemente del sistema operativo donde se ejecute el backend.

Para WSL existen dos posibilidades:

- **OPCIÓN A — Oracle accesible externamente:**  
  Si Oracle está disponible en Windows, en otro servidor o en una instancia de red accesible, configura la variable `DB_CONNECT_STRING` según el host correspondiente (por ejemplo `localhost:1521/XEPDB1`).

- **OPCIÓN B — Oracle mediante Docker:**  
  Conceptualmente, es posible ejecutar una instancia compatible de Oracle dentro de un contenedor Docker.  
  *Importante:* Actualmente el repositorio **no** incluye `docker-compose.yml` ni `Dockerfile` para Oracle. Por lo tanto, no se debe asumir que `docker compose up` esté disponible en el proyecto; es una alternativa que debe configurarse por separado e independientemente por el desarrollador.

Una vez que Oracle esté disponible y accesible, el desarrollador debe:

1. Crear y configurar el usuario `PRESTAMOS_APP`.
2. Conceder los permisos necesarios para tablas, secuencias y triggers (`CONNECT`, `RESOURCE`, cuota en `USERS`).
3. Ejecutar el archivo:
   ```bash
   database/script.sql
   ```
   para crear:
   - Tabla `EQUIPOS`
   - Tabla `PRESTAMOS`
   - Relaciones y restricciones de integridad
   - Secuencias y triggers para IDs automáticos
   - Datos iniciales de prueba

### 6. Iniciar el backend desde Ubuntu

Desde el directorio `PrestamoEquipos/backend`, ejecuta:

```bash
npm start
```

El servidor quedará disponible aproximadamente en:
- `http://localhost:3000`

Endpoints principales para verificar su funcionamiento:
- `http://localhost:3000/api/equipos`
- `http://localhost:3000/api/prestamos`

### 7. Frontend

El frontend está construido con tecnologías web nativas: **HTML5, CSS3 y JavaScript puro**.

Puede servirse mediante un servidor HTTP local. Si se utiliza una herramienta como `serve`, puedes ejecutar por ejemplo:

```bash
npx serve frontend
```

*(Nota: `serve` no es una dependencia obligatoria del proyecto).*

> **Aviso:** No se recomienda abrir `index.html` directamente con el protocolo `file://` (doble clic) como opción principal debido a las restricciones de seguridad del navegador para cargar módulos JavaScript (`ES Modules`). Debe servirse a través de un servidor HTTP local.

### 8. Pruebas con Postman

La colección disponible en:
- `postman/PrestamoEquipos.postman_collection.json`

también funciona perfectamente aunque el backend se ejecute dentro de WSL, siempre que `http://localhost:3000` sea accesible desde Windows (WSL2 realiza reenvío de puertos a localhost en Windows de forma transparente).

### 9. Diferencias principales: Windows vs WSL / Ubuntu

| Acción / Característica | Windows | WSL / Ubuntu |
|---|---|---|
| **Copiar archivo `.env`** | `copy .env.example .env` | `cp .env.example .env` |
| **Separador de rutas** | `\` (barra invertida) | `/` (barra diagonal) |
| **Ejemplo de ruta de trabajo** | `D:\Proyectos\PrestamoEquipos` | `~/proyectos/PrestamoEquipos` |
| **Iniciar backend** | `npm start` | `npm start` |
| **Instalar dependencias** | `npm install` | `npm install` |

### 10. Portabilidad del proyecto

El código principal del proyecto es totalmente portable entre Windows y Linux porque utiliza tecnologías estándar: **Node.js**, **Express**, **HTML**, **CSS**, **JavaScript** y configuración centralizada mediante **variables de entorno**.

Lo que puede variar entre diferentes equipos y entornos es:
- El proceso de instalación de Node.js.
- La ubicación y acceso a Oracle Database (local en Windows, remota o en contenedor).
- La contraseña asignada al usuario `PRESTAMOS_APP`.
- El valor configurado en `DB_CONNECT_STRING`.
- Los comandos propios de cada sistema operativo (por ejemplo `copy` vs `cp`).
- La disponibilidad de puertos de red ocupados en la máquina.

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

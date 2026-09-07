-- ============================================================
-- SISTEMA WEB PARA PRÉSTAMO DE EQUIPOS TECNOLÓGICOS
-- Script de Base de Datos Oracle
-- ============================================================
-- Ejecutar como usuario PRESTAMOS_APP en XEPDB1
-- Ejemplo:
--   sqlplus PRESTAMOS_APP/MI_CONTRASEÑA@localhost:1521/XEPDB1 @script.sql
-- ============================================================

-- ============================================================
-- 1. LIMPIEZA (para poder re-ejecutar en demos)
-- ============================================================
-- Eliminar tablas existentes (orden inverso por dependencias)
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE PRESTAMOS CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE EQUIPOS CASCADE CONSTRAINTS';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

-- Eliminar secuencias existentes
BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_EQUIPOS';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -2289 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_PRESTAMOS';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -2289 THEN RAISE; END IF;
END;
/

-- ============================================================
-- 2. SECUENCIAS
-- ============================================================
CREATE SEQUENCE SEQ_EQUIPOS
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

CREATE SEQUENCE SEQ_PRESTAMOS
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

-- ============================================================
-- 3. TABLA EQUIPOS
-- ============================================================
CREATE TABLE EQUIPOS (
    ID              NUMBER          PRIMARY KEY,
    NOMBRE          VARCHAR2(100)   NOT NULL,
    TIPO            VARCHAR2(50)    NOT NULL,
    SERIAL          VARCHAR2(50)    NOT NULL UNIQUE,
    ESTADO          VARCHAR2(20)    DEFAULT 'DISPONIBLE' NOT NULL,
    OBSERVACION     VARCHAR2(200),
    CONSTRAINT CHK_EQUIPO_ESTADO CHECK (ESTADO IN ('DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO'))
);

-- ============================================================
-- 4. TABLA PRESTAMOS
-- ============================================================
CREATE TABLE PRESTAMOS (
    ID                          NUMBER          PRIMARY KEY,
    EQUIPO_ID                   NUMBER          NOT NULL,
    RESPONSABLE                 VARCHAR2(100)   NOT NULL,
    IDENTIFICACION              VARCHAR2(30)    NOT NULL,
    FECHA_PRESTAMO              DATE            NOT NULL,
    FECHA_DEVOLUCION_PREVISTA   DATE            NOT NULL,
    ESTADO                      VARCHAR2(20)    DEFAULT 'ACTIVO' NOT NULL,
    CONSTRAINT FK_PRESTAMO_EQUIPO FOREIGN KEY (EQUIPO_ID)
        REFERENCES EQUIPOS(ID),
    CONSTRAINT CHK_PRESTAMO_ESTADO CHECK (ESTADO IN ('ACTIVO', 'DEVUELTO'))
);

-- ============================================================
-- 5. TRIGGERS PARA AUTO-INCREMENTAR ID
-- ============================================================
CREATE OR REPLACE TRIGGER TRG_EQUIPOS_ID
    BEFORE INSERT ON EQUIPOS
    FOR EACH ROW
    WHEN (NEW.ID IS NULL)
BEGIN
    :NEW.ID := SEQ_EQUIPOS.NEXTVAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_PRESTAMOS_ID
    BEFORE INSERT ON PRESTAMOS
    FOR EACH ROW
    WHEN (NEW.ID IS NULL)
BEGIN
    :NEW.ID := SEQ_PRESTAMOS.NEXTVAL;
END;
/

-- ============================================================
-- 6. DATOS INICIALES - EQUIPOS
-- ============================================================
-- 4 equipos DISPONIBLES
INSERT INTO EQUIPOS (ID, NOMBRE, TIPO, SERIAL, ESTADO, OBSERVACION)
VALUES (SEQ_EQUIPOS.NEXTVAL, 'Laptop Dell Latitude 5520', 'Laptop', 'DLL-5520-001', 'DISPONIBLE', 'Equipo en buen estado, 16GB RAM');

INSERT INTO EQUIPOS (ID, NOMBRE, TIPO, SERIAL, ESTADO, OBSERVACION)
VALUES (SEQ_EQUIPOS.NEXTVAL, 'Proyector Epson PowerLite', 'Proyector', 'EPS-PL-002', 'DISPONIBLE', 'Proyector HD para aulas');

INSERT INTO EQUIPOS (ID, NOMBRE, TIPO, SERIAL, ESTADO, OBSERVACION)
VALUES (SEQ_EQUIPOS.NEXTVAL, 'Tablet Samsung Galaxy Tab S7', 'Tablet', 'SMG-TAB-003', 'DISPONIBLE', 'Tablet con stylus incluido');

INSERT INTO EQUIPOS (ID, NOMBRE, TIPO, SERIAL, ESTADO, OBSERVACION)
VALUES (SEQ_EQUIPOS.NEXTVAL, 'Monitor LG UltraWide 29"', 'Monitor', 'LG-UW29-004', 'DISPONIBLE', 'Monitor ultra ancho para laboratorio');

-- 1 equipo PRESTADO
INSERT INTO EQUIPOS (ID, NOMBRE, TIPO, SERIAL, ESTADO, OBSERVACION)
VALUES (SEQ_EQUIPOS.NEXTVAL, 'Laptop HP ProBook 450', 'Laptop', 'HP-PB450-005', 'PRESTADO', 'Equipo prestado a docente');

-- 1 equipo en MANTENIMIENTO
INSERT INTO EQUIPOS (ID, NOMBRE, TIPO, SERIAL, ESTADO, OBSERVACION)
VALUES (SEQ_EQUIPOS.NEXTVAL, 'Impresora HP LaserJet Pro', 'Impresora', 'HP-LJ-006', 'MANTENIMIENTO', 'En reparación: atasco de papel frecuente');

-- ============================================================
-- 7. DATOS INICIALES - PRESTAMOS
-- ============================================================
-- 1 préstamo ACTIVO (correspondiente al equipo 5 que está PRESTADO)
INSERT INTO PRESTAMOS (ID, EQUIPO_ID, RESPONSABLE, IDENTIFICACION, FECHA_PRESTAMO, FECHA_DEVOLUCION_PREVISTA, ESTADO)
VALUES (SEQ_PRESTAMOS.NEXTVAL, 5, 'Carlos Mendoza', '1098765432', TO_DATE('2026-09-01', 'YYYY-MM-DD'), TO_DATE('2026-09-15', 'YYYY-MM-DD'), 'ACTIVO');

-- 1 préstamo DEVUELTO (histórico)
INSERT INTO PRESTAMOS (ID, EQUIPO_ID, RESPONSABLE, IDENTIFICACION, FECHA_PRESTAMO, FECHA_DEVOLUCION_PREVISTA, ESTADO)
VALUES (SEQ_PRESTAMOS.NEXTVAL, 1, 'María García', '1012345678', TO_DATE('2026-08-15', 'YYYY-MM-DD'), TO_DATE('2026-08-25', 'YYYY-MM-DD'), 'DEVUELTO');

-- 1 préstamo ACTIVO vencido (para demostrar la etiqueta VENCIDO)
INSERT INTO PRESTAMOS (ID, EQUIPO_ID, RESPONSABLE, IDENTIFICACION, FECHA_PRESTAMO, FECHA_DEVOLUCION_PREVISTA, ESTADO)
VALUES (SEQ_PRESTAMOS.NEXTVAL, 5, 'Juan Pérez', '1087654321', TO_DATE('2026-07-01', 'YYYY-MM-DD'), TO_DATE('2026-07-15', 'YYYY-MM-DD'), 'DEVUELTO');

COMMIT;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT 'EQUIPOS:' AS TABLA, COUNT(*) AS TOTAL FROM EQUIPOS
UNION ALL
SELECT 'PRESTAMOS:', COUNT(*) FROM PRESTAMOS;

SELECT ID, NOMBRE, TIPO, SERIAL, ESTADO FROM EQUIPOS ORDER BY ID;

SELECT ID, EQUIPO_ID, RESPONSABLE, ESTADO FROM PRESTAMOS ORDER BY ID;

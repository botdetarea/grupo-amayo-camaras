# Backend del sistema Grupo Amayo

Este backend usa Node.js, Express y la base MySQL/MariaDB existente `camaras`. No crea ni reinicia la base de datos. El endpoint de salud consulta MySQL realmente; no confirma disponibilidad si la consulta falla.

## Requisitos

- Windows con Node.js 20 o posterior y npm.
- XAMPP/MariaDB activo.
- La base `camaras` existente.

## Preparacion en PowerShell

Primero abre PowerShell y sitúate en `C:\Users\botde\Desktop\Nueva carpeta\backend`:

```powershell
Set-Location 'C:\Users\botde\Desktop\Nueva carpeta\backend'
Copy-Item .env.example .env
```

Antes de iniciar la API:

1. Reemplaza el secreto de `JWT_SECRET` en `.env` por uno aleatorio de al menos 32 caracteres. Puedes generarlo con:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

2. No configures la API con `root`. En phpMyAdmin o en un cliente SQL local, reemplaza el marcador de contraseña en `database\bootstrap\001_create_app_user.sql` y ejecútalo contra la base `camaras`. El script solo crea un usuario de aplicación y le concede `SELECT`, `INSERT` y `UPDATE`; no ejecuta DDL sobre las tablas ni borra datos. No publiques ni compartas el secreto.
3. Configura `DB_PASSWORD` en `.env` con la misma contraseña local elegida para `camaras_app`.
4. Instala y ejecuta:

   ```powershell
   npm install
   npm run dev
   ```

La API escucha en `http://localhost:3000`. Comprueba la conexión real a MySQL desde otra ventana:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

La respuesta correcta es `status: ok` y `database: connected`. Si MariaDB no está disponible o las credenciales fallan, la ruta devuelve HTTP 503; revisa el estado de MySQL y los valores locales de `.env`.

## Autenticación inicial

La tabla `usuarios` estaba vacía al auditar la base. Después de configurar la cuenta de aplicación, desde esta carpeta ejecuta:

```powershell
npm run create:superadmin
```

El comando solicita nombre y correo, y pide la contraseña sin mostrarla. Solo crea el primer superadministrador cuando `usuarios` está vacía; no crea usuarios de demostración. Las contraseñas se almacenan con bcrypt. Conserva la contraseña de forma segura: la API no la recupera.

Rutas implementadas:

- `GET /api/health`: comprueba `SELECT 1` contra la base configurada.
- `POST /api/auth/login`: valida credenciales y devuelve un JWT de duración limitada.
- `GET /api/auth/me`: exige un JWT válido y consulta el estado y rol actuales del usuario en MySQL.
- `GET /api/admin/summary`: devuelve conteos reales y está limitado a `superadmin` y `administrador`.

Los roles aceptados por la base son `superadmin`, `administrador` y `trabajador`. La autorización por rol está implementada como middleware para las rutas protegidas. No se exponen contraseñas ni datos biométricos.

## Pruebas

Con MariaDB activo y `.env` configurado con una cuenta de aplicación válida:

```powershell
npm test
```

Las pruebas son de integración: comprueban la conexión real, validación de login, credenciales inexistentes y protección de `/api/auth/me`. No crean usuarios ni registros ficticios. El login exitoso y las pruebas de permisos con usuarios reales quedan pendientes hasta que se registren cuentas autorizadas.

## Migración preparada, no aplicada

`database\migrations\001_add_event_idempotency.sql` agrega, de forma repetible y sin borrar registros, identificadores opcionales y únicos a `asistencias` y `visitas`. No la ejecutes todavía: primero conserva una copia de seguridad y aprueba expresamente la modificación del esquema. La API aún no registra asistencias ni visitas; las rutas correspondientes se agregarán después de validar esta base.

La tabla biométrica no se usa en esta etapa. Antes de habilitar reconocimiento, el backend debe comprobar que el consentimiento esté aceptado y pertenezca al mismo empleado que la plantilla.

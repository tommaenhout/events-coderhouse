# Events Coderhouse API

API REST para gestionar eventos y usuarios. Usa Express, MongoDB y Mongoose con
una arquitectura por capas basada en importaciones directas entre módulos.

## Funcionalidades

- Conexión a MongoDB local o MongoDB Atlas.
- Creación, consulta y actualización de eventos.
- Consulta, actualización y eliminación de usuarios.
- Registro de usuarios con contraseñas protegidas por bcrypt.
- Login con JWT almacenado en cookies HTTP Only.
- Consulta del usuario autenticado mediante una ruta protegida.
- Cierre de sesión mediante eliminación de la cookie de acceso.
- Validación de los datos de entrada.
- Mensajes de respuesta y errores dirigidos al cliente en español.
- Respuestas `400`, `401`, `404`, `409` y `500` consistentes.
- Cierre controlado del servidor y de la conexión a MongoDB.
- Pruebas unitarias con dependencias falsas, sin requerir una base de datos.

## Tecnologías

- Node.js 22+
- Express 5
- MongoDB Atlas
- Mongoose
- bcrypt
- JSON Web Token
- cookie-parser
- Passport, Passport Local y Passport JWT
- dotenv
- ECMAScript Modules
- Node.js Test Runner

## Instalación

```bash
git clone <URL_DEL_REPOSITORIO>
cd events-coderhouse
npm install
cp .env.example .env
```

## Configuración

Variables disponibles:

| Variable | Descripción | Valor predeterminado |
| --- | --- | --- |
| `PORT` | Puerto HTTP de la aplicación | `8080` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `MONGO_URL` | URI de conexión a MongoDB | `mongodb://127.0.0.1:27017/events-coderhouse` |
| `MONGO_DB_NAME` | Base de datos utilizada | `events` |
| `JWT_SECRET` | Secreto utilizado para firmar el token de acceso | `development-only-secret` |
| `JWT_EXPIRES_IN` | Duración del token de acceso | `1h` |
| `JWT_COOKIE_EXPIRES_IN` | Duración de la cookie de acceso en milisegundos | `3600000` |
| `JWT_REFRESH_SECRET` | Secreto de la utilidad de refresh token (sin endpoint activo) | `development-only-refresh-secret` |
| `JWT_REFRESH_EXPIRES_IN` | Duración de la utilidad de refresh token (sin endpoint activo) | `7d` |

Ejemplo con MongoDB local:

```env
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb://127.0.0.1:27017/events-coderhouse
MONGO_DB_NAME=events
JWT_SECRET=development-only-secret
JWT_EXPIRES_IN=1h
JWT_COOKIE_EXPIRES_IN=3600000
JWT_REFRESH_SECRET=development-only-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
```

Ejemplo con MongoDB Atlas:

```env
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb+srv://USUARIO:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=events
JWT_SECRET=development-only-secret
JWT_EXPIRES_IN=1h
JWT_COOKIE_EXPIRES_IN=3600000
JWT_REFRESH_SECRET=development-only-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
```

En Atlas, el usuario debe tener permisos sobre la base de datos y la dirección
IP del equipo debe estar habilitada en **Network Access**. Si la contraseña
contiene caracteres especiales, deben codificarse para poder usarlos en una URL.

El archivo `.env` está excluido de Git. No publiques credenciales reales ni las
copies dentro de `.env.example`.

## Ejecución

Modo normal:

```bash
npm start
```

Modo desarrollo con reinicio automático:

```bash
npm run dev
```

La API estará disponible en `http://localhost:8080`. El servidor HTTP se inicia
solamente después de establecer la conexión con MongoDB.

## Modelo de evento

| Campo | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `title` | `String` | Sí | Nombre del evento |
| `date` | `Date` | Sí | Fecha válida en formato ISO 8601 |
| `description` | `String` | No | Descripción del evento |
| `location` | `String` | No | Ubicación |
| `organizer` | `ObjectId` | Sí | Referencia a User, asignada automáticamente al usuario autenticado; no se puede modificar |

Mongoose agrega automáticamente `createdAt` y `updatedAt`. Los campos que no
pertenecen al modelo son descartados por el servicio.

## Modelo de usuario

| Campo | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `first_name` | `String` | Sí | Nombre del usuario |
| `last_name` | `String` | Sí | Apellido del usuario |
| `email` | `String` | Sí | Email único, normalizado a minúsculas |
| `password` | `String` | Sí | Contraseña almacenada como hash de bcrypt |
| `role` | `String` | No | `user`, `organizer` o `admin` |

Las respuestas públicas nunca incluyen `password`.

### Roles y matriz de permisos

El sistema reconoce tres roles. Toda cuenta creada mediante el registro público
recibe el rol `user`; un valor `role` enviado en el cuerpo de esa solicitud no
permite crear cuentas `organizer` ni `admin`.

| Acción | `user` | `organizer` | `admin` |
| --- | :---: | :---: | :---: |
| Consultar eventos | ✅ | ✅ | ✅ |
| Crear eventos | ❌ | ✅ | ✅ |
| Modificar eventos propios | ❌ | ✅ | ✅ |
| Modificar cualquier evento | ❌ | ❌ | ✅ |
| Ver todos los usuarios | ❌ | ❌ | ✅ |

Un `organizer` solamente puede modificar los eventos cuyo campo `organizer`
coincida con su identificador de usuario. Aunque tenga el rol correcto, recibe
`403 Forbidden` cuando intenta modificar un evento ajeno. Un `admin` puede
modificar cualquier evento.

### Rutas protegidas

| Método | Ruta | Acceso requerido |
| --- | --- | --- |
| `GET` | `/api/sessions/current` | Cualquier usuario autenticado |
| `GET` | `/api/events/:id` | Cualquier usuario autenticado |
| `POST` | `/api/events` | `organizer` o `admin` |
| `PUT` | `/api/events/:id` | `organizer` propietario del evento o `admin` |
| `GET` | `/api/users` | Solo `admin` |

Las rutas de eventos y usuarios ejecutan primero `authMiddleware`, que valida el
JWT almacenado en la cookie `currentUser` y asigna su contenido a `req.user`.
Después, `authorizeRoles` compara `req.user.role` con los roles permitidos para
la operación. La ruta `/api/sessions/current` también valida el JWT de la cookie
mediante la estrategia `current` de Passport.

### Diferencia entre 401 y 403

- `401 Unauthorized`: no existe una sesión válida. Ocurre cuando falta la cookie
  JWT o cuando el token es inválido o está vencido.
- `403 Forbidden`: existe una sesión válida, pero el rol o la propiedad del
  recurso no permiten realizar la acción solicitada.

Respuesta sin una sesión válida (`401`):

```json
{
  "status": "error",
  "message": "No autenticado"
}
```

Respuesta de un usuario autenticado sin permisos (`403`):

```json
{
  "status": "error",
  "message": "Acceso denegado"
}
```

Por ejemplo, un usuario con rol `user` recibe `403` al ejecutar
`POST /api/events`. Un `organizer` también recibe `403` al consultar
`GET /api/users` o al intentar modificar un evento perteneciente a otra persona.

## Endpoints

| Método | Ruta | Descripción | Respuestas |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Comprueba el estado del servidor | `200` |
| `GET` | `/api/events` | Lista todos los eventos | `200` |
| `GET` | `/api/events/:id` | Obtiene un evento | `200`, `400`, `401`, `404` |
| `POST` | `/api/events` | Crea un evento | `201`, `400`, `401`, `403` |
| `PUT` | `/api/events/:id` | Actualiza uno o más campos | `200`, `400`, `401`, `403`, `404` |
| `POST` | `/api/sessions/register` | Registra un usuario | `201`, `400`, `409` |
| `POST` | `/api/sessions/login` | Autentica un usuario y crea una cookie JWT | `200`, `401`, `500` |
| `GET` | `/api/sessions/current` | Devuelve el usuario autenticado | `200`, `401` |
| `POST` | `/api/sessions/logout` | Elimina la cookie de autenticación | `200` |
| `GET` | `/api/users` | Lista todos los usuarios; solo para administradores | `200`, `401`, `403` |

Las respuestas de eventos usan esta estructura:

```json
{
  "status": "success",
  "payload": {}
}
```

Los errores usan `status: "error"` y un campo `message`.

### Autenticación y sesiones

El módulo de sesiones implementa registro, login, consulta del usuario actual y
logout mediante estrategias de Passport:

```text
sessions router -> Passport middleware -> Passport strategy
                                      -> users service/repository
                -> sessions controller -> JWT cookie/response
```

La estrategia local `register` delega la validación, el hash y la persistencia a
`UsersService.registerUser`. La estrategia local `login` busca el usuario y
compara la contraseña mediante bcrypt. Si las credenciales son válidas, el
middleware coloca un usuario público en `req.user` y el controlador genera un
JWT de acceso en la cookie HTTP Only `currentUser`.

La estrategia JWT `current` extrae esa cookie, verifica el token y vuelve a
consultar el usuario antes de entregar una respuesta mediante `UserDTO`.

El JWT de acceso incluye `id`, `email` y `role`; nunca incluye la contraseña.
Las cookies usan `sameSite: "lax"` y solamente habilitan `secure` en producción.

## Probar la API con curl

Con el servidor ejecutándose, define la URL base:

```bash
BASE_URL="http://localhost:8080/api"
```

Comprobar el servidor:

```bash
curl "$BASE_URL/health"
```

Crear un evento:

```bash
curl --request POST "$BASE_URL/events" \
  --cookie cookies.txt \
  --header "Content-Type: application/json" \
  --data '{
    "title": "Conferencia de JavaScript",
    "description": "Encuentro para desarrolladores",
    "date": "2026-09-01T18:00:00.000Z",
    "location": "Buenos Aires"
  }'
```

Copia el `_id` de la respuesta y guárdalo para las siguientes solicitudes:

```bash
EVENT_ID="REEMPLAZAR_CON_EL_ID"
```

Listar todos los eventos:

```bash
curl "$BASE_URL/events"
```

Obtener un evento:

```bash
curl "$BASE_URL/events/$EVENT_ID"
```

Actualizar campos del evento:

```bash
curl --request PUT "$BASE_URL/events/$EVENT_ID" \
  --header "Content-Type: application/json" \
  --data '{
    "title": "Conferencia de JavaScript actualizada",
    "location": "Palermo, Buenos Aires"
  }'
```

Registrar un usuario mediante sesiones:

```bash
curl --request POST "$BASE_URL/sessions/register" \
  --header "Content-Type: application/json" \
  --data '{
    "first_name": "Tom",
    "last_name": "Tester",
    "email": "tom@example.com",
    "password": "password123"
  }'
```

Respuesta exitosa:

```json
{
  "message": "Usuario registrado exitosamente"
}
```

Iniciar sesión y guardar las cookies en un archivo local de curl:

```bash
curl --request POST "$BASE_URL/sessions/login" \
  --header "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  --data '{
    "email": "tom@example.com",
    "password": "password123"
  }'
```

Respuesta exitosa:

```json
{
  "status": "success",
  "message": "Login exitoso"
}
```

Si el email no existe, falta alguna credencial o la contraseña no coincide, la
API responde sin revelar qué dato falló:

```json
{
  "status": "error",
  "message": "Credenciales inválidas"
}
```

Consultar el usuario autenticado enviando la cookie `currentUser`:

```bash
curl --cookie cookies.txt "$BASE_URL/sessions/current"
```

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a...",
    "email": "tom@example.com",
    "role": "user"
  }
}
```

Sin una cookie válida, `/current` responde con `401 Unauthorized`.

Cerrar sesión y eliminar las cookies:

```bash
curl --request POST "$BASE_URL/sessions/logout" \
  --cookie cookies.txt \
  --cookie-jar cookies.txt
```

```json
{
  "status": "success",
  "message": "Logout correcto"
}
```

## Arquitectura por capas

Cada módulo importa directamente la siguiente capa:

```text
Mongoose -> database
Event model -> event DAO -> event repository -> events service
             -> events controller -> events router -> app
User model  -> user DAO  -> user repository  -> users service
             -> users controller -> users router -> app
Passport config -> register/login/current strategies -> sessions middleware
                -> sessions controller -> sessions router -> app
```

- Los routers importan sus controladores.
- Los controladores importan sus servicios.
- Los servicios importan sus repositorios.
- Los repositorios importan sus DAO.
- Los DAO importan los modelos de Mongoose.
- El registro reutiliza `UsersService`; login y current reutilizan el repositorio
  de usuarios.
- Passport Local procesa registro y login; Passport JWT protege `/current`.
- `jwt.js` centraliza la creación y verificación de los tokens.
- `hash.js` centraliza el hash y la comparación de contraseñas con bcrypt.
- `errorHandler` centraliza los errores de Express y recibe el logger.
- `app` importa los routers y configura Express.
- `server.js` conecta MongoDB e inicia la aplicación.
- `pickFields` es una utilidad reutilizable para aceptar únicamente campos
  permitidos en los datos de entrada.

Las capas mantienen separadas las reglas de negocio y las consultas aunque sus
dependencias se resuelven mediante importaciones directas.

## Estructura del proyecto

```text
events-coderhouse/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── startApplication.js
│   ├── config/
│   │   ├── database.js
│   │   ├── env.js
│   │   └── passport.js
│   ├── controllers/
│   │   ├── events.controller.js
│   │   ├── health.controller.js
│   │   ├── sessions.controller.js
│   │   └── users.controller.js
│   ├── dto/
│   │   └── user.dto.js
│   ├── dao/
│   │   ├── events.dao.js
│   │   └── users.dao.js
│   ├── errors/
│   │   ├── sessions.errors.js
│   │   └── users.errors.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── authorizeEventOwnerOrAdmin.js
│   │   ├── authorizeRole.js
│   │   ├── errorHandler.js
│   │   ├── login.middleware.js
│   │   ├── notFoundHandler.js
│   │   └── register.middleware.js
│   ├── models/
│   │   ├── event.model.js
│   │   └── user.model.js
│   ├── repositories/
│   │   ├── events.repository.js
│   │   └── users.repository.js
│   ├── routes/
│   │   ├── events.router.js
│   │   ├── sessions.router.js
│   │   └── users.router.js
│   ├── services/
│   │   ├── events.service.js
│   │   └── users.service.js
│   └── utils/
│       ├── handleServiceError.js
│       ├── hash.js
│       ├── jwt.js
│       └── pickFields.js
├── test/
│   ├── admin-users-route.test.js
│   ├── database.test.js
│   ├── errorHandler.test.js
│   ├── event-owner.middleware.test.js
│   ├── events-authorization.routes.test.js
│   ├── events.controller.test.js
│   ├── events.dao.test.js
│   ├── events.repository.test.js
│   ├── events.service.test.js
│   ├── jwt.test.js
│   ├── login.middleware.test.js
│   ├── notFoundHandler.test.js
│   ├── passport.test.js
│   ├── pickFields.test.js
│   ├── register.middleware.test.js
│   ├── sessions.controller.test.js
│   ├── startApplication.test.js
│   ├── auth.middleware.test.js
│   ├── users.dao.test.js
│   ├── users.repository.test.js
│   └── users.service.test.js
├── .env.example
├── package.json
└── README.md
```

## Pruebas

```bash
npm test
```

Las pruebas verifican las consultas del DAO, la delegación del repositorio, las
reglas del servicio y las respuestas del controlador. También cubren las
estrategias Passport de registro, login y current, la cookie de autenticación,
la generación y verificación de JWT, logout, middleware, utilidades y ciclo de
vida de la aplicación. No se conectan a MongoDB Atlas.

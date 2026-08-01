# Events Coderhouse API

API REST para gestionar eventos. Usa Express, MongoDB y Mongoose, con una
arquitectura por capas y dependencias inyectadas para mantener desacoplados el
acceso a datos, los controladores y las rutas.

## Funcionalidades

- Conexión a MongoDB local o MongoDB Atlas.
- CRUD completo de eventos.
- CRUD completo de usuarios, separado del módulo de sesiones.
- Validación de los datos de entrada.
- Respuestas `400`, `404` y `500` consistentes.
- Cierre controlado del servidor y de la conexión a MongoDB.
- Pruebas unitarias con dependencias falsas, sin requerir una base de datos.

## Tecnologías

- Node.js 22+
- Express 5
- MongoDB Atlas
- Mongoose
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
| `JWT_SECRET` | Secreto reservado para autenticación futura | `development-only-secret` |

Ejemplo con MongoDB local:

```env
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb://127.0.0.1:27017/events-coderhouse
MONGO_DB_NAME=events
JWT_SECRET=development-only-secret
```

Ejemplo con MongoDB Atlas:

```env
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb+srv://USUARIO:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=events
JWT_SECRET=development-only-secret
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
| `organizer` | `String` | No | Organizador |

Mongoose agrega automáticamente `createdAt` y `updatedAt`. Los campos que no
pertenecen al modelo son descartados por el servicio.

## Modelo de usuario

| Campo | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `name` | `String` | Sí | Nombre del usuario |
| `email` | `String` | Sí | Email único, normalizado a minúsculas |
| `role` | `String` | No | `user` o `admin`; usa `user` por defecto |

El modelo no contiene contraseñas porque la autenticación todavía está fuera del
alcance del proyecto.

## Endpoints

| Método | Ruta | Descripción | Respuestas |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Comprueba el estado del servidor | `200` |
| `GET` | `/api/events` | Lista todos los eventos | `200` |
| `GET` | `/api/events/:id` | Obtiene un evento | `200`, `400`, `404` |
| `POST` | `/api/events` | Crea un evento | `201`, `400` |
| `PUT` | `/api/events/:id` | Actualiza uno o más campos | `200`, `400`, `404` |
| `DELETE` | `/api/events/:id` | Elimina un evento | `200`, `400`, `404` |
| `GET` | `/api/users` | Lista todos los usuarios | `200` |
| `GET` | `/api/users/:id` | Obtiene un usuario | `200`, `400`, `404` |
| `POST` | `/api/users` | Crea un usuario | `201`, `400`, `409` |
| `PUT` | `/api/users/:id` | Actualiza uno o más campos | `200`, `400`, `404`, `409` |
| `DELETE` | `/api/users/:id` | Elimina un usuario | `200`, `400`, `404` |
| `GET` | `/api/sessions` | Ruta inicial de sesiones | `200` |

Todas las respuestas de eventos y usuarios usan esta estructura:

```json
{
  "status": "success",
  "payload": {}
}
```

Los errores usan `status: "error"` y un campo `message`.

### Estructura inicial de sesiones

`GET /api/sessions` conserva una respuesta vacía y pasa por una estructura
inyectable de router, controlador y servicio:

```text
sessions router -> sessions controller -> sessions service
```

```json
{
  "status": "success",
  "payload": []
}
```

Esta estructura no implementa registro, login, contraseñas, JWT, persistencia de
sesiones, autenticación ni autorización. Es solamente el punto de extensión para
una entrega futura.

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
  --header "Content-Type: application/json" \
  --data '{
    "title": "Conferencia de JavaScript",
    "description": "Encuentro para desarrolladores",
    "date": "2026-09-01T18:00:00.000Z",
    "location": "Buenos Aires",
    "organizer": "Coderhouse"
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

Eliminar el evento:

```bash
curl --request DELETE "$BASE_URL/events/$EVENT_ID"
```

Crear un usuario:

```bash
curl --request POST "$BASE_URL/users" \
  --header "Content-Type: application/json" \
  --data '{
    "name": "Tom",
    "email": "tom@example.com",
    "role": "user"
  }'
```

Los demás endpoints de usuarios siguen el mismo patrón del CRUD de eventos:

```bash
USER_ID="REEMPLAZAR_CON_EL_ID"
curl "$BASE_URL/users"
curl "$BASE_URL/users/$USER_ID"
curl --request PUT "$BASE_URL/users/$USER_ID" \
  --header "Content-Type: application/json" \
  --data '{"name":"Tom actualizado"}'
curl --request DELETE "$BASE_URL/users/$USER_ID"
```

## Arquitectura e inyección de dependencias

`server.js` funciona como raíz de composición y conecta las capas:

```text
Mongoose -> database
Event model -> event DAO -> event repository -> events service
             -> events controller -> events router -> app
User model  -> user DAO  -> user repository  -> users service
             -> users controller  -> users router  -> app
```

- `database` recibe el cliente de Mongoose y la configuración de conexión.
- `eventDao` recibe el modelo `Event` y ejecuta las consultas de Mongoose.
- `eventRepository` recibe el DAO y expone las operaciones de persistencia.
- `eventService` recibe el repositorio y aplica validación y reglas de negocio.
- `eventsController` recibe el servicio y traduce sus resultados a HTTP.
- `eventsRouter` recibe el controlador.
- El módulo de usuarios replica las mismas capas para mantener su persistencia y
  sus reglas independientes de eventos y sesiones.
- El módulo inicial de sesiones inyecta `sessionsService` en
  `sessionsController` y este último en `sessionsRouter`.
- `errorHandler` centraliza los errores de Express y recibe el logger.
- `app` recibe los routers y configura el middleware de errores.
- `startApplication` recibe la aplicación, la base de datos y el puerto.
- `pickFields` es una utilidad reutilizable para aceptar únicamente campos
  permitidos en los datos de entrada.

De esta manera, las pruebas pueden reemplazar MongoDB y cada capa por objetos
falsos pequeños.

## Estructura del proyecto

```text
events-coderhouse/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── startApplication.js
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── events.controller.js
│   │   ├── health.controller.js
│   │   ├── sessions.controller.js
│   │   └── users.controller.js
│   ├── dao/
│   │   ├── events.dao.js
│   │   └── users.dao.js
│   ├── errors/
│   │   └── users.errors.js
│   ├── middlewares/
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Event.js
│   │   └── User.js
│   ├── repositories/
│   │   ├── events.repository.js
│   │   └── users.repository.js
│   ├── routes/
│   │   ├── events.router.js
│   │   ├── sessions.router.js
│   │   └── users.router.js
│   ├── services/
│   │   ├── events.service.js
│   │   ├── sessions.service.js
│   │   └── users.service.js
│   └── utils/
│       └── pickFields.js
├── test/
│   ├── database.test.js
│   ├── errorHandler.test.js
│   ├── events.controller.test.js
│   ├── events.dao.test.js
│   ├── events.repository.test.js
│   ├── events.service.test.js
│   ├── pickFields.test.js
│   ├── sessions.controller.test.js
│   ├── sessions.service.test.js
│   ├── startApplication.test.js
│   ├── users.controller.test.js
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

Las pruebas verifican la inyección del cliente de base de datos, las consultas
del DAO, la delegación del repositorio, las reglas del servicio y las respuestas
del controlador. También cubren el middleware de errores, las utilidades y el
ciclo de vida de la aplicación. No leen `.env` ni se conectan a MongoDB Atlas.

## Trabajo futuro

- Autenticación y emisión de JWT.
- Autorización por roles.
- Persistencia real de sesiones cuando se incorpore autenticación.
- Paginación y filtros para eventos.

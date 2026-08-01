# Events Coderhouse API

API REST inicial para una plataforma de gestión de eventos. El proyecto establece
una arquitectura por capas que permitirá incorporar persistencia, autenticación y
lógica de negocio en entregas posteriores.

## Tecnologías

- Node.js
- Express
- MongoDB Atlas
- Mongoose
- dotenv
- ECMAScript Modules (ESM)
- Node.js Test Runner

## Requisitos previos

- Node.js 22 o superior
- npm
- Git

Se necesita una instancia de MongoDB local o un cluster de MongoDB Atlas.

## Instalación

Luego de clonar el repositorio, ingresar al proyecto e instalar sus dependencias:

```bash
cd events-coderhouse
npm install
```

## Variables de entorno

Crear el archivo local `.env` a partir del ejemplo:

```bash
cp .env.example .env
```

Variables disponibles:

| Variable | Descripción | Valor de desarrollo |
| --- | --- | --- |
| `PORT` | Puerto HTTP del servidor | `8080` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `MONGO_URL` | URL de conexión a MongoDB | `mongodb://127.0.0.1:27017/events-coderhouse` |
| `MONGO_DB_NAME` | Nombre de la base de datos | `events` |
| `JWT_SECRET` | Secreto para firmar tokens en futuras entregas | `development-only-secret` |

Ejemplo de configuración:

```env
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb://127.0.0.1:27017/events-coderhouse
MONGO_DB_NAME=events
JWT_SECRET=development-only-secret
```

El archivo `.env` contiene configuración local y está excluido de Git. No se
deben publicar credenciales ni secretos reales.

## Ejecución

Iniciar el servidor:

```bash
npm start
```

Iniciar en modo desarrollo con reinicio automático:

```bash
npm run dev
```

Ejecutar las pruebas automatizadas:

```bash
npm test
```

Por defecto, la API queda disponible en `http://localhost:8080`.

## Estructura del proyecto

```text
events-coderhouse/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   ├── routes/
│   │   ├── events.router.js
│   │   └── sessions.router.js
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   └── sessions.controller.js
│   ├── services/
│   ├── repositories/
│   │   └── events.repository.js
│   ├── dao/
│   ├── models/
│   │   ├── User.js
│   │   └── Event.js
│   ├── middlewares/
│   └── utils/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

`server.js` es la raíz de composición: crea la conexión, el repositorio, el
controlador y el router, e inyecta cada dependencia. `app.js` solamente configura
Express con los routers recibidos. Esto permite probar cada capa con dependencias
falsas, sin conectarse a MongoDB.

## Rutas disponibles

| Método | Ruta | Descripción | Estado |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Comprueba que el servidor esté activo | `200` |
| `GET` | `/api/events` | Lista todos los eventos | `200` |
| `GET` | `/api/events/:id` | Obtiene un evento por ID | `200`, `404` |
| `POST` | `/api/events` | Crea un evento | `201`, `400` |
| `PUT` | `/api/events/:id` | Actualiza campos de un evento | `200`, `400`, `404` |
| `DELETE` | `/api/events/:id` | Elimina un evento | `200`, `404` |
| `GET` | `/api/sessions` | Devuelve la colección inicial de sesiones | `200` |

### Health

Solicitud:

```http
GET /api/health
```

Respuesta:

```json
{
  "status": "ok",
  "message": "Servidor activo"
}
```

### Events

Crear un evento:

```http
POST /api/events
Content-Type: application/json

{
  "title": "Conferencia de JavaScript",
  "description": "Encuentro para desarrolladores",
  "date": "2026-09-01T18:00:00.000Z",
  "location": "Buenos Aires",
  "organizer": "Coderhouse"
}
```

`title` y `date` son obligatorios. Los campos admitidos son `title`,
`description`, `date`, `location` y `organizer`.

Listar eventos:

```http
GET /api/events
```

Respuesta:

```json
{
  "status": "success",
  "payload": []
}
```

Consultar, actualizar o eliminar un evento utilizando su `_id`:

```http
GET /api/events/64f1a2b3c4d5e6f789012345
PUT /api/events/64f1a2b3c4d5e6f789012345
DELETE /api/events/64f1a2b3c4d5e6f789012345
```

### Sessions

Solicitud:

```http
GET /api/sessions
```

Respuesta:

```json
{
  "status": "success",
  "payload": []
}
```

## Alcance de la primera entrega

La aplicación se conecta a MongoDB antes de abrir el servidor HTTP. El recurso
`events` implementa persistencia CRUD sobre la colección homónima; `sessions`
continúa como estructura inicial para una entrega posterior.

Todavía no se incluyen autenticación, autorización ni emisión de JWT.

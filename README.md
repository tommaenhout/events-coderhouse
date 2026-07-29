# Events Coderhouse API

API REST inicial para una plataforma de gestión de eventos. El proyecto establece
una arquitectura por capas que permitirá incorporar persistencia, autenticación y
lógica de negocio en entregas posteriores.

## Tecnologías

- Node.js
- Express
- dotenv
- ECMAScript Modules (ESM)
- Node.js Test Runner

## Requisitos previos

- Node.js 22 o superior
- npm
- Git

MongoDB no necesita estar instalado ni ejecutándose para esta primera entrega,
porque todavía no se implementó la persistencia.

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
| `JWT_SECRET` | Secreto para firmar tokens en futuras entregas | `development-only-secret` |

Ejemplo de configuración:

```env
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb://127.0.0.1:27017/events-coderhouse
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

`app.js` configura Express y sus rutas. `server.js` es el único archivo que
levanta el servidor HTTP.

## Rutas disponibles

| Método | Ruta | Descripción | Estado |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Comprueba que el servidor esté activo | `200` |
| `GET` | `/api/events` | Devuelve la colección inicial de eventos | `200` |
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

Solicitud:

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

Esta pre-entrega establece el servidor Express, la configuración por variables
de entorno y la separación inicial entre rutas, controladores y las demás capas.
Los recursos `events` y `sessions` devuelven listas vacías de forma intencional.

Todavía no se incluyen conexión a MongoDB, operaciones CRUD, persistencia,
autenticación, autorización ni emisión de JWT. Esas funcionalidades quedan
preparadas para incorporarse en entregas posteriores.

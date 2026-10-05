# Events Coderhouse API

API REST para gestionar eventos, usuarios e inscripciones. Usa Express, MongoDB y Mongoose con
una arquitectura por capas basada en importaciones directas entre módulos.

## Funcionalidades

- Conexión a MongoDB local o MongoDB Atlas.
- Creación, consulta y actualización de eventos.
- Consulta de usuarios restringida a administradores.
- Registro de usuarios con contraseñas protegidas por bcrypt.
- Login con JWT almacenado en cookies HTTP Only.
- Consulta del usuario autenticado mediante una ruta protegida.
- Cierre de sesión mediante eliminación de la cookie de acceso.
- Roles `user`, `organizer` y `admin`, con control de propiedad de eventos.
- Filtros, paginación y ordenamiento del listado de eventos.
- Inscripción a eventos, consulta de tickets y cancelación con liberación de cupos.
- Emails de confirmación y cancelación mediante Nodemailer.
- Validación de los datos de entrada.
- Mensajes de respuesta y errores dirigidos al cliente en español.
- Manejo de errores `400`, `401`, `403`, `404`, `409` y `500`.
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
- Nodemailer
- dotenv
- ECMAScript Modules
- Node.js Test Runner

## Instalación

Requisitos: Node.js 22 o superior, npm y acceso a MongoDB local o Atlas.
Para enviar notificaciones también se necesita una cuenta SMTP.
Reemplaza `<URL_DEL_REPOSITORIO>` por la dirección de este repositorio.

```bash
git clone <URL_DEL_REPOSITORIO>
cd events-coderhouse
npm install
cp .env.example .env
```

En PowerShell, usa `Copy-Item .env.example .env` en lugar de `cp`.
Si PowerShell bloquea `npm.ps1`, ejecuta `npm.cmd install`, `npm.cmd start`
o `npm.cmd test`, según corresponda.

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
| `MAIL_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `MAIL_PORT` | Puerto SMTP; `465` activa TLS desde la conexión | `587` |
| `MAIL_USER` | Usuario SMTP | Cadena vacía |
| `MAIL_PASS` | Contraseña SMTP | Cadena vacía |
| `MAIL_FROM` | Remitente de las notificaciones | Sin valor predeterminado en el código; ver `.env.example` |

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

### Configuración de correo

Completa estas variables en `.env` con los datos de tu servidor SMTP:

```env
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=USUARIO_SMTP
MAIL_PASS=PASSWORD_SMTP
MAIL_FROM="Events <notifications@example.com>"
```

El remitente debe estar autorizado por el proveedor. Los valores anteriores son
marcadores de ejemplo. El puerto `465` configura `secure: true`; para otros
puertos, el transporte se crea con `secure: false`. Reinicia el servidor después
de cambiar `.env`, ya que el transporte se crea al importar su configuración.

No existe un modo de correo desactivado ni una ruta para probar SMTP. Puedes usar
un servidor SMTP de pruebas con credenciales de prueba y comprobar el envío
mediante una inscripción y su cancelación. Las pruebas automatizadas sustituyen
el servicio de correo y no verifican la entrega real. Consulta también las
limitaciones al final de este documento.

### Configuración de producción

El arranque exige `MONGO_URL` y `JWT_SECRET` cuando `NODE_ENV=production`.
Configura un secreto propio y acceso HTTPS para que el navegador envíe la cookie
`secure`. El puerto debe ser un entero entre `1` y `65535`, y
`JWT_COOKIE_EXPIRES_IN` debe ser un número positivo en milisegundos.
Las variables SMTP no se validan al arrancar: un servidor iniciado no demuestra
que el correo esté configurado correctamente.

## Ejecución

Inicio con reinicio automático mediante nodemon:

```bash
npm start
```

Modo desarrollo con reinicio automático:

```bash
npm run dev
```

La API estará disponible en `http://localhost:8080`. El servidor HTTP se inicia
solamente después de establecer la conexión con MongoDB.

Para iniciar sin vigilancia de archivos, ejecuta `node src/server.js`.

## Modelo de evento

| Campo | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `title` | `String` | Sí | Nombre del evento |
| `description` | `String` | Sí | Descripción del evento |
| `category` | `String` | Sí | Categoría del evento |
| `date` | `Date` | Sí | Fecha futura válida en formato ISO 8601 |
| `location` | `String` | Sí | Ubicación |
| `capacity` | `Number` | Sí | Capacidad mayor que cero |
| `reserved` | `Number` | No | Cupos reservados; empieza en `0` y lo administra la lógica de tickets |
| `price` | `Number` | Sí | Precio igual o mayor que cero |
| `status` | `String` | No | `draft`, `published`, `cancelled` o `finished`; por defecto `draft` |
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

El registro exige una contraseña de al menos ocho caracteres y nombres no vacíos.
El modelo también conserva `provider` (`local`) y `providerId` (`null` en el
registro actual). No hay endpoints de actualización ni eliminación de usuarios.

## Modelo de ticket

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `user` | `ObjectId` | Usuario titular; se obtiene de la sesión |
| `event` | `ObjectId` | Evento al que corresponde la inscripción |
| `quantity` | `Number` | Lugares solicitados; el servicio exige un entero mayor que cero |
| `status` | `String` | `pending`, `confirmed` o `cancelled`; la inscripción crea `confirmed` |
| `reservationCode` | `String` | Código generado por el backend, con índice único |
| `cancelledAt` | `Date` | Fecha de cancelación; inicialmente `null` |
| `createdAt`, `updatedAt` | `Date` | Marcas de tiempo generadas por Mongoose |

La API de inscripción exige `quantity` en el cuerpo, aunque el modelo tenga
un valor predeterminado de `1`. No hay un flujo HTTP para tickets `pending`.

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
| Inscribirse y consultar tickets propios | ✅ | ✅ | ✅ |
| Consultar tickets de un evento propio | ❌ | ✅ | ✅ |
| Consultar tickets de cualquier evento | ❌ | ❌ | ✅ |
| Cancelar tickets propios | ✅ | ✅ | ✅ |
| Cancelar tickets ajenos | ❌ | ❌ | ✅ |

### Preparar cuentas con permisos

El registro público siempre crea cuentas `user`. Para probar organizadores y
administradores, registra las cuentas primero y asigna sus roles directamente
en MongoDB con una herramienta de administración. No hay un endpoint de roles
ni un script de seed incluido. Por ejemplo, en `mongosh`, usando la base indicada
por `MONGO_DB_NAME`:

```javascript
use events
db.users.updateOne(
  { email: "organizer@example.com" },
  { $set: { role: "organizer" } }
)
```

Para una cuenta administradora, asigna `admin` a la cuenta correspondiente.
Después de modificar un rol, vuelve a iniciar sesión para obtener un JWT con
los permisos actualizados.

Un `organizer` solamente puede modificar los eventos cuyo campo `organizer`
coincida con su identificador de usuario. Aunque tenga el rol correcto, recibe
`403 Forbidden` cuando intenta modificar un evento ajeno. Un `admin` puede
modificar cualquier evento.

### Rutas protegidas

| Método | Ruta | Acceso requerido |
| --- | --- | --- |
| `GET` | `/api/sessions/current` | Cualquier usuario autenticado |
| `POST` | `/api/events` | `organizer` o `admin` |
| `PUT` | `/api/events/:id` | `organizer` propietario del evento o `admin` |
| `PATCH` | `/api/events/:id/status` | `organizer` propietario del evento o `admin` |
| `GET` | `/api/users` | Solo `admin` |
| `POST` | `/api/tickets/event/:eid/enroll` | Cualquier usuario autenticado |
| `GET` | `/api/tickets/my-tickets` | Cualquier usuario autenticado |
| `GET` | `/api/tickets/event/:eid/tickets` | `organizer` propietario del evento o `admin` |
| `PATCH` | `/api/tickets/:tid/cancel` | Titular del ticket o `admin` |

Las rutas `GET /api/events` y `GET /api/events/:id` son públicas. Las rutas de
creación, actualización y cambio de estado ejecutan `authMiddleware`, que valida
el JWT almacenado en la cookie `currentUser` y asigna su contenido a `req.user`.
Después, `authorizeRoles` y `authorizeEventOwnerOrAdmin` comprueban el rol y la
propiedad del evento. La ruta `/api/sessions/current` también valida el JWT
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
| `GET` | `/api/events` | Lista eventos con filtros y paginación | `200`, `400` |
| `GET` | `/api/events/:id` | Obtiene un evento públicamente | `200`, `400`, `404` |
| `POST` | `/api/events` | Crea un evento | `201`, `400`, `401`, `403` |
| `PUT` | `/api/events/:id` | Actualiza uno o más campos | `200`, `400`, `401`, `403`, `404` |
| `PATCH` | `/api/events/:id/status` | Cambia el estado sin eliminar el evento | `200`, `400`, `401`, `403`, `404` |
| `POST` | `/api/tickets/event/:eid/enroll` | Inscribe al usuario autenticado en un evento | `201`, `400`, `401`, `404`, `409` |
| `GET` | `/api/tickets/my-tickets` | Lista las inscripciones del usuario autenticado | `200`, `401` |
| `GET` | `/api/tickets/event/:eid/tickets` | Lista inscripciones; propietario del evento o admin | `200`, `400`, `401`, `403`, `404` |
| `PATCH` | `/api/tickets/:tid/cancel` | Cancela una inscripción propia o como admin | `200`, `400`, `401`, `403`, `404` |
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

Las respuestas de tickets usan `status`, `message` y `data`; las de eventos y
consulta de usuarios usan `payload`. El registro devuelve únicamente `message`.
Los identificadores `:id`, `:eid` y `:tid` deben ser ObjectId válidos de MongoDB.
La tabla enumera respuestas habituales; los fallos inesperados de base de datos
o correo también pueden producir `500`.

El manejador central devuelve errores con `status: "error"` y `message`.
En `/api/sessions/current`, la respuesta `401` la genera directamente Passport
y puede no tener ese formato JSON.

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

Los comandos siguientes usan Bash (por ejemplo, Git Bash). Para seguir el flujo,
registra una cuenta, asígnale el rol `organizer` e inicia sesión con los ejemplos
de autenticación de esta sección antes de crear eventos. `cookies.txt` debe
contener la sesión de esa cuenta. La API no incluye un frontend.

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
    "category": "conference",
    "date": "2099-09-01T18:00:00.000Z",
    "location": "Buenos Aires",
    "capacity": 200,
    "price": 15000
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

El listado siempre está paginado. Admite los filtros `status`, `category`,
`location`, `dateFrom` y `dateTo`; `page` y `limit` controlan la paginación, y
`sort` admite `date`, `price`, `title`, `category` o `location`. Un prefijo `-`
ordena de manera descendente:

```bash
curl "$BASE_URL/events?status=published&category=workshop&page=2&limit=5&sort=-date"
```

La respuesta contiene `data`, `page`, `limit`, `total` y `totalPages` dentro de
`payload`.

| Parámetro | Comportamiento |
| --- | --- |
| `status` | Uno de `draft`, `published`, `cancelled`, `finished` |
| `category`, `location` | Coincidencia mediante expresión regular, sin distinguir mayúsculas |
| `dateFrom`, `dateTo` | Límites inclusivos de fecha; usar ISO 8601 |
| `page` | Página; valor predeterminado `1` |
| `limit` | Tamaño de página; valor predeterminado `10`, máximo `100` |
| `sort` | Campo permitido; valor predeterminado `date`; `-` invierte el orden |

Obtener un evento:

```bash
curl "$BASE_URL/events/$EVENT_ID"
```

Actualizar campos del evento:

```bash
curl --request PUT "$BASE_URL/events/$EVENT_ID" \
  --cookie cookies.txt \
  --header "Content-Type: application/json" \
  --data '{
    "title": "Conferencia de JavaScript actualizada",
    "location": "Palermo, Buenos Aires"
  }'
```

Cambiar el estado de un evento propio (o de cualquier evento siendo `admin`):

```bash
curl --request PATCH "$BASE_URL/events/$EVENT_ID/status" \
  --cookie cookies.txt \
  --header "Content-Type: application/json" \
  --data '{"status":"cancelled"}'
```

La cancelación es definitiva en la API actual. Para probar inscripciones,
usa un evento distinto que esté `published`, o publica el evento recién creado
antes de cancelarlo, con `{"status":"published"}` en esa misma ruta.

### Reglas de negocio de eventos

- `organizer` se toma del usuario autenticado; un valor enviado en el body se ignora.
- Solo `organizer` y `admin` pueden crear eventos.
- Un organizador solo puede actualizar o cambiar el estado de sus propios eventos;
  un administrador puede gestionar cualquier evento.
- La fecha de creación debe ser futura, `capacity` debe ser mayor que cero y
  `price` debe ser igual o mayor que cero.
- Un evento cancelado no puede modificarse ni cambiar nuevamente de estado.
- Un evento finalizado no puede volver a publicarse.
- Cancelar significa cambiar `status` a `cancelled`; los eventos no se eliminan
  físicamente.

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

## Inscripciones y tickets con curl

Usa un evento publicado con fecha futura y cupos disponibles. Inicia sesión con
la cuenta que realizará la inscripción y conserva su cookie en `cookies.txt`.
`EVENT_ID` debe contener el identificador del evento.

### Inscribirse

```bash
curl --request POST "$BASE_URL/tickets/event/$EVENT_ID/enroll" \
  --cookie cookies.txt \
  --header "Content-Type: application/json" \
  --data '{"quantity":2}'
```

Respuesta `201` de ejemplo (los identificadores y el código son ilustrativos):

```json
{
  "status": "success",
  "message": "Inscripción realizada con éxito",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "event": "507f1f77bcf86cd799439011",
    "quantity": 2,
    "status": "confirmed",
    "reservationCode": "CODIGO_GENERADO"
  }
}
```

Guarda `data.id` para cancelar posteriormente:

```bash
TICKET_ID="REEMPLAZAR_CON_EL_ID_DEL_TICKET"
```

### Consultar tickets propios

```bash
curl --cookie cookies.txt "$BASE_URL/tickets/my-tickets"
```

La respuesta incluye `data` como arreglo de tickets, ordenados por creación
descendente. Cada ticket expone `_id`, `user`, `event`, `quantity`, `status`,
`reservationCode`, `cancelledAt` y sus marcas de tiempo. El evento relacionado
se devuelve mediante `EventDTO`. También se incluyen tickets cancelados.

### Consultar inscripciones de un evento

Inicia sesión como organizador propietario o administrador y usa su archivo de
cookies. Puedes mantenerlo separado del participante como `organizer-cookies.txt`:

```bash
curl --request POST "$BASE_URL/sessions/login" \
  --header "Content-Type: application/json" \
  --cookie-jar organizer-cookies.txt \
  --data '{"email":"organizer@example.com","password":"password123"}'

curl --cookie organizer-cookies.txt "$BASE_URL/tickets/event/$EVENT_ID/tickets"
```

Reemplaza las credenciales por las de la cuenta organizadora registrada y
promovida previamente en MongoDB.

La respuesta devuelve `data` como arreglo y carga nombre, apellido y email del
titular de cada ticket, sin contraseña. Incluye todos los estados de ticket.

### Cancelar una inscripción

```bash
curl --request PATCH "$BASE_URL/tickets/$TICKET_ID/cancel" \
  --cookie cookies.txt
```

La respuesta `200` contiene `status: "success"`, el mensaje
`"Ticket cancelado con éxito"` y el ticket en `data`, con `status: "cancelled"`
y `cancelledAt`. No requiere cuerpo. El titular o un administrador puede cancelar;
el rol de organizador por sí solo no permite cancelar tickets ajenos.

### Reglas de inscripción y cupos

- El evento debe existir, estar publicado y tener una fecha futura.
- `quantity` debe representar un entero mayor que cero.
- La comprobación previa rechaza otro ticket `confirmed` del mismo usuario y
  evento con `409`.
- La reserva incrementa `reserved` mediante una actualización condicional que
  comprueba estado, fecha y capacidad en MongoDB. Cupos insuficientes producen `400`.
- Si falla la creación del ticket, el servicio intenta devolver los cupos reservados.
- La cancelación cambia el estado, registra su fecha y libera la cantidad reservada.
  Una segunda cancelación secuencial produce `400`.
- Tras cancelar un ticket, el usuario puede inscribirse nuevamente si el evento
  sigue admitiendo inscripciones.
- Inscripción y cancelación intentan enviar una notificación por SMTP.
- Cancelar un evento solo cambia su estado: no cancela automáticamente sus tickets
  ni envía notificaciones a todos los asistentes.

Estas operaciones tienen limitaciones de concurrencia y de manejo de fallos,
descritas al final del documento.

## Consulta administrativa de usuarios

Después de iniciar sesión con una cuenta `admin` y guardar su cookie en
`admin-cookies.txt`:

```bash
curl --cookie admin-cookies.txt "$BASE_URL/users"
```

La respuesta `200` contiene `status: "success"` y `payload` como arreglo de
usuarios públicos con `_id`, `first_name`, `last_name`, `email`, `role` y las
marcas de tiempo disponibles. No incluye contraseñas. Una cuenta `user` u
`organizer` recibe `403`.

## Arquitectura por capas

Cada módulo importa directamente la siguiente capa:

```text
Mongoose -> database
Event model -> event DAO -> event repository -> events service
             -> events controller -> events router -> app
User model  -> user DAO  -> user repository  -> users service
             -> users controller -> users router -> app
Ticket model -> ticket DAO -> ticket repository -> ticket service
              -> tickets controller -> tickets router -> app
Passport config -> register/login/current strategies -> sessions middleware
                -> sessions controller -> sessions router -> app
```

- Los routers importan sus controladores.
- Los controladores solo leen `params`, `query`, `body` y el usuario autenticado,
  llaman a un servicio y construyen la respuesta HTTP.
- Los servicios concentran validaciones, cupos, estados, duplicados, permisos y
  notificaciones; consumen repositorios y nunca modelos o DAO.
- Los repositorios traducen operaciones del dominio (`findByEmail`, reserva de
  cupos, cancelación de tickets) a llamadas al DAO correspondiente.
- Los DAO son la única capa que importa modelos de Mongoose y ejecuta consultas.
- Los DTO de usuario, evento y ticket definen cada respuesta pública. También
  filtran documentos relacionados obtenidos con `populate`, por lo que nunca se
  serializa un `password`.
- Registro, login y current reutilizan `UsersService`.
- Passport Local procesa registro y login; Passport JWT protege `/current`.
- `jwt.js` centraliza la creación y verificación de los tokens.
- `hash.js` centraliza el hash y la comparación de contraseñas con bcrypt.
- `errorHandler` centraliza los errores de Express y conserva la distinción entre
  400, 401, 403, 404, 409 y 500.
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
│   │   ├── mailerConfig.js
│   │   └── passport.js
│   ├── controllers/
│   │   ├── events.controller.js
│   │   ├── health.controller.js
│   │   ├── sessions.controller.js
│   │   ├── tickets.controller.js
│   │   └── users.controller.js
│   ├── dto/
│   │   ├── dto.utils.js
│   │   ├── event.dto.js
│   │   ├── ticket.dto.js
│   │   └── user.dto.js
│   ├── dao/
│   │   ├── events.dao.js
│   │   ├── tickets.dao.js
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
│   │   ├── ticket.model.js
│   │   └── user.model.js
│   ├── repositories/
│   │   ├── events.repository.js
│   │   ├── ticket.repository.js
│   │   └── users.repository.js
│   ├── routes/
│   │   ├── events.router.js
│   │   ├── sessions.router.js
│   │   ├── tickets.router.js
│   │   └── users.router.js
│   ├── services/
│   │   ├── email.service.js
│   │   ├── events.service.js
│   │   ├── ticket.service.js
│   │   └── users.service.js
│   └── utils/
│       ├── handleServiceError.js
│       ├── hash.js
│       ├── jwt.js
│       ├── pickFields.js
│       └── ticketCode.js
├── test/
│   ├── admin-users-route.test.js
│   ├── database.test.js
│   ├── dto.test.js
│   ├── env.test.js
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
│   ├── tickets.controller.test.js
│   ├── tickets.dao.test.js
│   ├── tickets.repository.test.js
│   ├── tickets.routes.test.js
│   ├── tickets.service.test.js
│   ├── auth.middleware.test.js
│   ├── users.dao.test.js
│   ├── users.repository.test.js
│   └── users.service.test.js
├── .env.example
├── .gitignore
├── package-lock.json
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
vida de la aplicación. Para tickets se prueban inscripción, duplicados, cupos,
rollback ante fallos, permisos, consultas, cancelación, emails, DTO y contratos
HTTP. Las consultas Mongoose y el correo se sustituyen por dependencias falsas:
no se conectan a MongoDB ni al servidor SMTP. Las pruebas HTTP arrancan servidores
locales temporales. La suite contiene actualmente 74 pruebas; que pasen no
demuestra la entrega de emails ni la integridad bajo solicitudes concurrentes.

Para ejecutar un archivo específico:

```bash
node --test test/tickets.service.test.js
```

Para validar manualmente con servicios reales, configura MongoDB y SMTP, registra
un participante y un organizador, publica un evento y comprueba inscripción,
consulta de tickets y cancelación. Verifica los correos recibidos y el contador
`reserved` antes y después. Prueba también credenciales inválidas, un usuario sin
permisos, una inscripción duplicada y una cantidad que exceda la capacidad.

## Solución de problemas

| Síntoma | Comprobación |
| --- | --- |
| El servidor no inicia | Revisar el error de consola, Node.js, puerto y configuración de MongoDB |
| Falla la conexión a Atlas | Revisar URI, contraseña codificada, permisos e IP habilitada |
| `401` en una ruta protegida | Iniciar sesión y enviar la cookie `currentUser`; puede haber vencido |
| `403` al crear o modificar eventos | Revisar rol, propiedad del evento y volver a iniciar sesión tras cambiar el rol |
| `400` al inscribirse | Revisar ObjectId, cantidad, estado publicado, fecha y cupos |
| `409` al inscribirse | Consultar tickets propios; ya existe uno confirmado |
| `500` durante inscripción o cancelación | Revisar consola, SMTP y estado del ticket antes de reintentar: la operación puede haberse guardado |
| Cookie ausente en producción | Usar HTTPS; la cookie de login tiene `secure: true` |
| PowerShell bloquea `npm.ps1` | Usar `npm.cmd` para los comandos npm |

## Limitaciones conocidas

El proyecto implementa los módulos del curso, con estos puntos pendientes:

- La comprobación de inscripción duplicada y la creación del ticket son pasos
  separados. El índice por usuario, evento y estado no es único, por lo que
  solicitudes simultáneas pueden crear más de un ticket confirmado.
- La cancelación no usa una actualización condicional del estado. Dos solicitudes
  simultáneas pueden intentar liberar los mismos cupos; la condición de liberación
  evita valores negativos, pero no asegura que cada ticket libere cupos solo una vez.
- Reserva, creación de ticket y cancelación no forman una transacción. Un fallo
  entre pasos puede dejar desalineados los tickets y el contador de cupos.
- Al actualizar un evento no se comprueba que su nueva capacidad sea igual o
  mayor que `reserved`.
- Los emails se envían después de guardar la operación. Un fallo SMTP produce
  `500` aunque el ticket ya esté creado o cancelado; no hay cola ni reintentos.
- Las plantillas usan `user.first_name`, que no está en el JWT de estas rutas,
  y `ticket.id`, aunque los tickets se devuelven como objetos con `_id`. Esos
  campos pueden aparecer como `undefined`. Una cancelación por admin envía
  el correo al administrador que realizó la acción, no al titular del ticket.
- El transporte SMTP configura `tls.rejectUnauthorized: false`, desactivando
  la validación del certificado. Debe corregirse antes de usarlo en producción.
- Las rutas que usan `authMiddleware` toman el rol del JWT y no recargan al usuario.
  Los cambios de rol no afectan a tokens ya emitidos hasta un nuevo login o su
  expiración. Logout elimina la cookie, pero no revoca un token previamente copiado.
- Hay utilidades de refresh token, pero no un endpoint de renovación; tampoco
  hay endpoints para modificar usuarios, asignar roles o procesar pagos.

La documentación describe el comportamiento actual; estos puntos requieren
cambios de implementación y validación adicionales.

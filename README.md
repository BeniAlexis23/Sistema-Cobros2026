# Sistema Cobros

Aplicacion base para gestion de cobros con:

- Backend: Node.js, Express, MySQL, JWT, Multer, CSV/Excel import.
- Frontend: React, Vite, React Router, rutas protegidas.
- Docker: disponible para mas adelante; primero trabajaremos local con Laragon.

## Estructura

```txt
backend/
  src/
    controllers/
    libs/
    middlewares/
    models/
    routes/
    schemas/
    uploads/
    app.js
    config.js
    db.js
frontend/
  src/
    api/
    assets/
    components/
    context/
    pages/
    utils/
    App.jsx
```

## Arranque local con Laragon

Este es el flujo recomendado para desarrollar primero sin Docker. La base de datos se gestiona desde Laragon usando MySQL local.

Parte de estos archivos:

- `backend/.env.example`
- `frontend/.env.example`

Configuracion esperada en `backend/.env`:

```env
PORT=4000
NODE_ENV=development
DB_AUTO_SETUP=true
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sistema_cobros
FRONTEND_URL=http://localhost:5173
STORAGE_DRIVER=local
```

Antes de iniciar el backend, abre Laragon y enciende MySQL.

Backend:

```bash
cd backend
cp .env.example .env
pnpm install
pnpm run dev
```

- Backend: http://localhost:4000/api/health
- MySQL local con Laragon: localhost:3306

Frontend:

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api

Al iniciar, el backend ejecuta el setup de base de datos y crea/verifica `sistema_cobros` con sus tablas. Si cambiaste la contrasena de MySQL en Laragon, actualiza `DB_PASSWORD` en `backend/.env` antes de correr `pnpm run dev`.

## Storage local o S3

El backend soporta dos modos para comprobantes:

```env
STORAGE_DRIVER=local
```

o

```env
STORAGE_DRIVER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=TU_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=TU_SECRET_KEY
AWS_S3_BUCKET=sistema-cobros-prod-files
AWS_S3_BASE_URL=https://sistema-cobros-prod-files.s3.us-east-1.amazonaws.com
```

Si usas `s3`, los comprobantes se suben a AWS S3 y en la base se guarda la URL del archivo. Si usas `local`, se siguen guardando en `backend/src/uploads`.

## Arranque con Docker

```bash
docker compose up --build
```

Usaremos este modo mas adelante cuando terminemos las pruebas locales con Laragon.

## Scripts utiles

```bash
cd backend
pnpm run db:setup
pnpm run dev

cd frontend
pnpm run dev
```

## Carga masiva

El importador acepta `.csv`, `.xlsx` y `.xls`. Columnas recomendadas:

```txt
full_name, document_number, phone, email, address, payment_status, amount_due, due_date, notes
```

Tambien reconoce algunos nombres en espanol: `nombre`, `documento`, `telefono`, `correo`, `direccion`, `estado_pago`, `monto_pendiente`, `fecha_vencimiento`.

## WhatsApp

En clientes pendientes aparece un enlace a WhatsApp con mensaje prellenado. WhatsApp Web no permite adjuntar archivos directamente desde una URL externa mediante `wa.me`; por eso la factura/boleta se carga y queda almacenada en el backend para asociarla al cliente. Luego podemos mejorar este modulo con una integracion real usando WhatsApp Business API.

## Produccion recomendada

Arquitectura prevista:

- Frontend en Vercel
- Backend en Dokploy desde `backend/Dockerfile`
- MySQL como servicio separado en Dokploy
- Comprobantes en AWS S3

Archivos de referencia:

- `backend/.env.production.example`
- `frontend/.env.production.example`

Variables clave del backend en produccion:

```env
PORT=4000
NODE_ENV=production
DB_AUTO_SETUP=false

DB_HOST=mysql
DB_PORT=3306
DB_USER=sistema_cobros_app
DB_PASSWORD=CAMBIAR_PASSWORD
DB_NAME=sistema_cobros

JWT_SECRET=CAMBIAR_POR_UN_SECRETO_LARGO
FRONTEND_URL=https://tu-frontend.vercel.app

STORAGE_DRIVER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=TU_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=TU_SECRET_KEY
AWS_S3_BUCKET=sistema-cobros-prod-files
AWS_S3_BASE_URL=https://sistema-cobros-prod-files.s3.us-east-1.amazonaws.com
```

Notas importantes de produccion:

- En Dokploy no uses `localhost` para `DB_HOST`; usa el hostname interno del servicio MySQL.
- `DB_AUTO_SETUP=false` evita que la API intente crear la base en cada arranque. Usa `pnpm run db:setup` solo para bootstrap controlado o habilitalo temporalmente si el usuario MySQL tiene permisos suficientes.
- Configura `FRONTEND_URL` con el dominio real del frontend para que CORS funcione correctamente.
- Rota cualquier credencial AWS antigua antes de desplegar.

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

Configuracion esperada en `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sistema_cobros
```

Antes de iniciar el backend, abre Laragon y enciende MySQL.

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

- Backend: http://localhost:4000/api/health
- MySQL local con Laragon: localhost:3306

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api

Al iniciar, el backend ejecuta el setup de base de datos y crea/verifica `sistema_cobros` con sus tablas. Si cambiaste la contrasena de MySQL en Laragon, actualiza `DB_PASSWORD` en `backend/.env` antes de correr `npm run dev`.

## Arranque con Docker

```bash
docker compose up --build
```

Usaremos este modo mas adelante cuando terminemos las pruebas locales con Laragon.

## Scripts utiles

```bash
cd backend
npm run db:setup
npm run dev

cd frontend
npm run dev
```

## Carga masiva

El importador acepta `.csv`, `.xlsx` y `.xls`. Columnas recomendadas:

```txt
full_name, document_number, phone, email, address, payment_status, amount_due, due_date, notes
```

Tambien reconoce algunos nombres en espanol: `nombre`, `documento`, `telefono`, `correo`, `direccion`, `estado_pago`, `monto_pendiente`, `fecha_vencimiento`.

## WhatsApp

En clientes pendientes aparece un enlace a WhatsApp con mensaje prellenado. WhatsApp Web no permite adjuntar archivos directamente desde una URL externa mediante `wa.me`; por eso la factura/boleta se carga y queda almacenada en el backend para asociarla al cliente. Luego podemos mejorar este modulo con una integracion real usando WhatsApp Business API.

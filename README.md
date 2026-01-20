#  Cartera Clientes

Aplicación web unificada: React + Express + Prisma + PostgreSQL

##  Inicio

\\\bash
- npm install
- npx prisma generate
- npm test     # Probar BD
- npm start    # Servidor (puerto 3001)
\\\

##  Estructura

- \src\ - Frontend React
- \routes\ - Backend Express
- \prisma\ - Schema BD
- \server.js\ - Servidor único

##  Endpoints

- POST /api/auth/login
- GET /api/cartera
- GET /api/pedidos  
- GET /api/items

Aplicación completa en http://localhost:3001

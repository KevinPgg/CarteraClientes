# Models DB - Modelos de Base de Datos

Esta carpeta contiene los modelos que corresponden exactamente con las tablas de PostgreSQL. Estos modelos se usan en el backend (routes) para convertir datos de Prisma a formatos serializables y seguros para enviar al frontend.

## Estructura de Modelos

### User.js
**Correspondencia BD:** Tabla `users` en PostgreSQL

**Campos:**
- `id` - Identificador único (INT)
- `card_code` - Código de cliente (VARCHAR 25)
- `card_name` - Nombre del cliente (VARCHAR 150)
- `tipo` - Tipo de cliente (VARCHAR 1)
- `notificacion` - Flag de notificaciones (BOOLEAN)
- `email_` - Array de emails
- `password_` - Contraseña encriptada con bcrypt (TEXT, auto-encriptada por trigger)
- `usuario` - Nombre de usuario único (TEXT)

**Métodos:**
- `toSafeObject()` - Devuelve el usuario sin la contraseña
- `toLoginResponse()` - Devuelve objeto optimizado para respuesta de login

### Cartera.js
**Correspondencia BD:** Tabla `cartera` en PostgreSQL

**Campos:**
- `id` - Identificador único
- `docentry` - Entrada de documento
- `cardcode` - Código del cliente (FK)
- `cardname` - Nombre del cliente
- `docnum` - Número de documento (BigInt)
- `folionum` - Número de folio
- `docduedate` - Fecha de vencimiento
- `docdate` - Fecha del documento
- `taxdate` - Fecha de impuesto
- `po` - Orden de compra
- `doctotal` - Total del documento (Decimal)
- `clase` - Clase/tipo de documento
- `dias_pendientes` - Días pendientes
- `comments` - Comentarios
- `saldovencido` - Saldo vencido (Decimal)
- `tipocliente` - Tipo de cliente
- `status` - Estado del documento

**Métodos:**
- `toJSON()` - Serializa correctamente BigInt a string y Decimals a number

### Pedido.js
**Correspondencia BD:** Tabla `pedidos` en PostgreSQL

**Campos:**
- `id` - Identificador único
- `po` - Orden de compra
- `docdate` - Fecha del documento
- `lineanegocio` - Línea de negocio
- `lineaproducto` - Línea de producto
- `itemcode` - Código del producto
- `nombreitem` - Nombre del producto
- `quantitybase` - Cantidad base (Decimal)
- `quantity` - Cantidad (Decimal)
- `factura` - Número de factura
- `totalfactura` - Total de la factura (Decimal)
- `clienteorigen` - Cliente origen
- `empventas` - Empleado de ventas
- `destino` - Destino de envío

**Métodos:**
- `toJSON()` - Serializa decimales correctamente

### Item.js
**Correspondencia BD:** Tabla `items` en PostgreSQL

**Campos:**
- `id` - Identificador único
- `codigo` - Código del producto (requerido)
- `nombre` - Nombre del producto (requerido)

**Métodos:**
- `toJSON()` - Serialización estándar

## Cambios de Campos Importantes

| Campo BD | Prisma Map | Notas |
|----------|-----------|-------|
| `password_` | `@map("password_")` | ¡CRÍTICO! Guion bajo en BD, Prisma la mapea como `password` |
| `email_` | `@map("email_")` | Array de emails con guion bajo |
| `card_code` | `@map("card_code")` | CamelCase en Prisma |
| `card_name` | `@map("card_name")` | CamelCase en Prisma |
| `dias_pendientes` | `@map("dias_pendientes")` | Guion bajo en BD |

## Uso en Routes

### Backend (routes/)
```javascript
import { User } from '../src/modelsDB/User.js';
import { Cartera } from '../src/modelsDB/Cartera.js';

// En auth.js
const user = new User(userData);
res.json(user.toLoginResponse());

// En cartera.js
const cartera = carteraData.map(data => new Cartera(data));
res.json(cartera.map(c => c.toJSON()));
```

### Frontend (Services/)
Los datos ya vienen serializados correctamente desde el backend, así que:
- BigInt ya están como strings
- Decimals ya son numbers
- Fechas vienen como ISO strings

## Sincronización BD ↔ Prisma ↔ Modelos

1. **Base de Datos**: Columnas definidas en PostgreSQL
2. **Prisma Schema**: Define modelos con mappings a columnas BD
3. **Prisma Client**: Genera cliente automático
4. **modelsDB Models**: Envuelven datos para serialización segura
5. **Backend Routes**: Convierten Prisma → Models → JSON
6. **Frontend Services**: Reciben JSON normalizado

## Notas Importantes

- Los modelos de `modelsDB/` son para backend únicamente
- Los modelos en `src/Models/` son para frontend (UserOrder, CartItem, etc.)
- El campo `password_` se auto-encripta en la BD mediante trigger PostgreSQL
- La verificación de contraseña usa `crypt()` de PostgreSQL, no JavaScript
- BigInt debe convertirse a string para JSON (handled by toJSON)
- Decimals deben convertirse a number para JSON (handled by toJSON)
